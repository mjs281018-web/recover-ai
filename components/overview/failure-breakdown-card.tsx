import { ChartFrame } from '@/components/charts/chart-frame'
import { Badge } from '@/components/ui/badge'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import type { FailureReasonBreakdown } from '@/types'

const RECOVERABILITY_VARIANT = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
} as const

export function FailureBreakdownCard({ breakdown, className }: { breakdown: FailureReasonBreakdown[]; className?: string }) {
  return (
    <ChartFrame
      title="Failure intelligence"
      description="Share of failure volume, revenue impact, and how recoverable each reason typically is."
      className={className}
    >
      <div className="flex flex-col gap-3">
        {breakdown.map((item) => (
          <div key={item.reason} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs font-medium text-muted-foreground">{item.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.max(2, item.share * 100)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
              {formatPercent(item.share)}
            </span>
            <span className="hidden w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
              {formatCompactCurrency(item.revenueImpact)}
            </span>
            <Badge variant={RECOVERABILITY_VARIANT[item.recoverability]} className="hidden shrink-0 md:inline-flex">
              {item.recoverability}
            </Badge>
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}
