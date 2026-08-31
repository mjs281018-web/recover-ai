import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MetricDisplay({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  accent = 'default',
  className,
}: {
  label: string
  value: string
  hint?: string
  /** signed ratio, e.g. 0.061 → +6.1% */
  delta?: number
  icon?: React.ComponentType<{ className?: string }>
  accent?: 'default' | 'success' | 'warning' | 'danger' | 'ai'
  className?: string
}) {
  const accentText =
    accent === 'success'
      ? 'text-success'
      : accent === 'warning'
        ? 'text-warning'
        : accent === 'danger'
          ? 'text-danger'
          : accent === 'ai'
            ? 'text-ai'
            : 'text-muted-foreground'

  const positive = (delta ?? 0) >= 0

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn('size-4', accentText)} />}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        <div className="flex items-center gap-2">
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                positive ? 'text-success' : 'text-danger',
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {Math.abs((delta ?? 0) * 100).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </div>
    </div>
  )
}
