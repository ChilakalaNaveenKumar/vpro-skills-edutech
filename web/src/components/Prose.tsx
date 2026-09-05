import type { Segment } from '../content/narrative'

// Renders the narrative modules' segmented paragraphs, so the decision about
// which phrase carries the highlighter lives in the copy and is reviewable as
// copy rather than buried in a component.
//
// The highlighter draws itself as the line crosses the viewport - see .mark in
// index.css. `<mark>` is the correct element: it means "relevant in the current
// context", which is exactly the job.
export function Prose({ paras, className = '' }: { paras: Segment[][]; className?: string }) {
  return (
    <div className={className}>
      {paras.map((para, index) => (
        <p key={index} className="lede mt-7 max-w-[62ch] first:mt-0">
          {para.map((segment, segmentIndex) => {
            if (typeof segment === 'string') return segment
            if ('strike' in segment) {
              return (
                <span key={segmentIndex} className="strike">
                  {segment.text}
                </span>
              )
            }
            return (
              <mark
                key={segmentIndex}
                className="mark"
              >
                {segment.text}
              </mark>
            )
          })}
        </p>
      ))}
    </div>
  )
}
