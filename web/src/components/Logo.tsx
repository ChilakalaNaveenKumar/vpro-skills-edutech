// Real VPro Skills logo (public/logo-wide.png) on light surfaces. That file has
// a solid white background and a charcoal half, so on the dark journey it is
// replaced by an authored typographic wordmark rather than a white box.
interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  onDark?: boolean
}

const HEIGHT_CLASS: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-14',
}

const DARK_TEXT_CLASS: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
}

export default function Logo({ size = 'md', onDark = false }: LogoProps) {
  if (onDark) {
    return (
      <span
        className={`font-editorial inline-flex items-baseline gap-1.5 font-semibold ${DARK_TEXT_CLASS[size]}`}
      >
        <span className="text-ember">VPro</span>
        <span className="text-bone/85 text-[0.62em] uppercase tracking-[0.34em]">Skills</span>
      </span>
    )
  }

  return (
    <img
      src="/logo-wide.png"
      alt="VPro Skills EduTech"
      className={`${HEIGHT_CLASS[size]} w-auto shrink-0`}
    />
  )
}
