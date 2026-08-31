'use client'

import { ArrowRight } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RecoveryFunnelStage } from '@/types'

const STAGE_COLOR: Record<string, string> = {
  'at-risk': 'var(--color-danger)',
  'identified-recoverable': 'var(--color-warning)',
  'actions-initiated': 'var(--color-ai)',
  recovered: 'var(--color-success)',
}

function FunnelTooltipContent({ stage }: { stage: RecoveryFunnelStage }) {
  return (
    <div className="w-60 space-y-1.5 py-1">
      <div className="text-sm font-semibold text-foreground">{stage.label}</div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>Payments</span>
        <span className="font-medium tabular-nums text-foreground">{stage.paymentCount.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>Revenue</span>
        <span className="font-medium tabular-nums text-foreground">{formatCompactCurrency(stage.revenue)}</span>
      </div>
      {stage.conversionFromPrevious !== undefined && (
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Conversion</span>
          <span className="font-medium tabular-nums text-foreground">{formatPercent(stage.conversionFromPrevious)}</span>
        </div>
      )}
      {stage.topFailureReasons && stage.topFailureReasons.length > 0 && (
        <div className="border-t border-border pt-1.5">
          <div className="text-muted-foreground">Top failure reasons</div>
          <div className="text-foreground">{stage.topFailureReasons.join(', ')}</div>
        </div>
      )}
      {stage.strategy && (
        <div className="border-t border-border pt-1.5">
          <div className="text-muted-foreground">Recovery strategy</div>
          <div className="text-foreground">{stage.strategy}</div>
        </div>
      )}
    </div>
  )
}

export function RecoveryFunnel({
  stages,
  pulseKey,
}: {
  stages: RecoveryFunnelStage[]
  /** Stage key to visually pulse, e.g. right after a live recovery completes. */
  pulseKey?: string
}) {
  const maxCount = Math.max(...stages.map((s) => s.paymentCount))

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-1">
      {stages.map((stage, i) => {
        const color = STAGE_COLOR[stage.key]
        const heightPct = Math.max(20, (stage.paymentCount / maxCount) * 100)
        return (
          <div key={stage.key} className="flex flex-1 items-center gap-1">
            <Tooltip content={<FunnelTooltipContent stage={stage} />} side="top">
              <div
                className={cn(
                  'flex w-full cursor-default flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:bg-elevated hover:shadow-md',
                  stage.key === pulseKey && 'border-success/50 bg-success-muted/50 animate-pulse',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
                  {stage.conversionFromPrevious !== undefined && (
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                      {formatPercent(stage.conversionFromPrevious)}
                    </span>
                  )}
                </div>
                <div className="flex h-14 items-end">
                  <div
                    className="w-full rounded-md transition-[height] duration-700 ease-out"
                    style={{ height: `${heightPct}%`, backgroundColor: color, opacity: 0.85 }}
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="text-lg font-semibold tabular-nums text-foreground">
                    {stage.paymentCount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs font-semibold tabular-nums" style={{ color }}>
                    {formatCompactCurrency(stage.revenue)}
                  </div>
                </div>
              </div>
            </Tooltip>
            {i < stages.length - 1 && (
              <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground/40 md:block" />
            )}
          </div>
        )
      })}
    </div>
  )
}
