interface Props {
  items: string[]
}

// The course names, drifting. Duplicated once so the loop has no visible seam.
export default function Ticker({ items }: Props) {
  const doubled = [...items, ...items]
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden py-5 shadow-[inset_0_1px_0_0_var(--rule)]"
    >
      <div className="flex w-max animate-[ticker_52s_linear_infinite] gap-[68px] motion-reduce:animate-none">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="display shrink-0 whitespace-nowrap text-[22px] tracking-[-0.01em] text-[color:rgb(237_231_222_/_0.55)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
