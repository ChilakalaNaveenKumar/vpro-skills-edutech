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

/**
 * The file is 440x225. That is deliberate rather than arbitrary: the largest
 * this is ever drawn is 56px tall, so 225 leaves headroom past the 3x screens
 * this gets read on. It was a 1224x626 PNG weighing 213KB - roughly a quarter
 * of everything the site shipped, for something the header draws 26px tall.
 * Flattening it to a 64-colour palette costs nothing visible on a flat
 * three-colour mark and took it to 8.7KB.
 *
 * width and height are the intrinsic pixels, not the display size. The CSS
 * still decides how big it is; these only give the browser the ratio so it can
 * reserve the space before the file arrives, instead of reflowing the header
 * once it does.
 */
export default function Logo({ size = 'md' }: LogoProps) {
  return (
    <img
      src="/logo-wide.png"
      alt="VPro Skills EduTech"
      width={440}
      height={225}
      className={`${HEIGHT_CLASS[size]} w-auto shrink-0`}
    />
  )
}
