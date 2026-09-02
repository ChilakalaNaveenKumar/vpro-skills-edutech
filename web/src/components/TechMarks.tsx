import { TECH_LABELS, TECH_MARKS } from '../content/techMarks'

// Real technology marks, inlined as SVG. The bodies come from a package at
// author time, never from user input, so they are safe to inject.
export default function TechMarks({ techs, className = '' }: { techs: string[]; className?: string }) {
  return (
    <ul className={`tech-marks flex flex-wrap items-center gap-2.5 ${className}`}>
      {techs.map((name, index) => {
        const mark = TECH_MARKS[name]
        if (!mark) return null
        const label = TECH_LABELS[name] ?? name
        return (
          <li
            key={name}
            className="tech-mark"
            style={{ ['--i' as string]: index }}
            title={label}
          >
            <svg
              viewBox={`0 0 ${mark.w} ${mark.h}`}
              width="26"
              height="26"
              role="img"
              aria-label={label}
              dangerouslySetInnerHTML={{ __html: mark.body }}
            />
          </li>
        )
      })}
    </ul>
  )
}
