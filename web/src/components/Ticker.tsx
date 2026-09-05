interface Props {
  items: string[]
}

// The course names, drifting. Duplicated once so the loop has no visible seam.
export default function Ticker({ items }: Props) {
  const doubled = [...items, ...items]
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-[color:var(--rule)] py-5"
    >
      <div className="flex w-max animate-[ticker_52s_linear_infinite] gap-16 motion-reduce:animate-none">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="display shrink-0 text-[clamp(1.4rem,2.4vw,2rem)] text-[color:var(--on-ink-faint)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
