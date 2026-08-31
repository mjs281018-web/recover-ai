import { cn } from '@/lib/utils'
import { formatPercent } from '@/lib/format'

/**
 * A compact horizontal meter for recovery probability (0–1).
 * Color shifts across semantic thresholds so risk reads at a glance.
 */
export function ProbabilityBar({
  value,
  showLabel = true,
  className,
}: {
  value: number
  showLabel?: boolean
  className?: string
}) {
  const pct = Math.max(0, Math.min(1, value))
  const tone =
    pct >= 0.75 ? 'bg-success' : pct >= 0.5 ? 'bg-warning' : 'bg-danger'
  const labelTone =
    pct >= 0.75 ? 'text-success' : pct >= 0.5 ? 'text-warning' : 'text-danger'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Recovery probability"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', tone)}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('w-9 shrink-0 text-right text-xs font-medium tabular-nums', labelTone)}>
          {formatPercent(pct)}
        </span>
      )}
    </div>
  )
}
