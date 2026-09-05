import type { ScheduleRow } from '../utils/schedule'

// The comp carries a per-batch line - "Few seats left" on one, "Registration
// open" on the next - so this renders whatever the admin set on that batch and
// nothing at all when they set nothing. It is an editorial claim, not a count:
// `Batch` has no capacity column. If one is added, this is where it reads from.
export default function SeatsNote({
  row,
  className = '',
}: {
  row: ScheduleRow
  className?: string
}) {
  if (!row.batch.seats_note) return null
  return <span className={`text-[color:var(--tan)] ${className}`}>{row.batch.seats_note}</span>
}
