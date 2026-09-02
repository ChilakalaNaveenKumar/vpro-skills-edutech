// Splits a heading into per-word spans so each rises independently. The parent
// must carry the unsplit phrase as aria-label; these spans are presentational.
export default function SplitWords({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={className} aria-hidden="true">
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="word" style={{ ['--i' as string]: index }}>
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  )
}
