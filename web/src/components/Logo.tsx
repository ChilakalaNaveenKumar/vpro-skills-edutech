// The real VPro Skills logo (public/logo-wide.png), a white-plated mark. On the
// dark marketing surface the comp seats it on a bone tile rather than dropping
// it straight onto the ground, which is why the plate does not read as a stray
// white box there.
interface LogoProps {
  size?: 'plate' | 'sm' | 'md' | 'lg'
}

const HEIGHT_CLASS: Record<NonNullable<LogoProps['size']>, string> = {
  /** The comp's header and footer tile. */
  plate: 'h-[26px]',
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
