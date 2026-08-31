import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCompactCurrency } from '@/lib/format'
import { RECOVERY_ACTION_LABELS } from '@/types'
import type { RootCauseInsight } from '@/types'

const RECOVERABILITY_VARIANT = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
} as const

export function RootCauseCard({ insights }: { insights: RootCauseInsight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Root cause intelligence</CardTitle>
        <CardDescription>What&apos;s driving failures, and what the agent recommends doing about each.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border pt-0">
        {insights.map((insight) => (
          <div key={insight.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{insight.label}</span>
                <Badge variant={RECOVERABILITY_VARIANT[insight.recoverability]}>{insight.recoverability} recoverability</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {insight.frequency.toLocaleString('en-IN')} payments · {formatCompactCurrency(insight.revenueImpact)} impact
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[11px] text-muted-foreground">Recommended</div>
              <div className="text-xs font-medium text-ai">{RECOVERY_ACTION_LABELS[insight.recommendedIntervention]}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
