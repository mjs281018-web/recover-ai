import { TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EarlyWarning, RiskLevel } from '@/types'

const SEVERITY_VARIANT: Record<RiskLevel, 'danger' | 'warning' | 'success'> = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'success',
}

export function EarlyWarningCard({ warnings }: { warnings: EarlyWarning[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Early warning</CardTitle>
        <CardDescription>Anomalies the model is watching before they show up in recovered revenue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {warnings.map((warning) => (
          <div key={warning.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold tracking-wide text-foreground uppercase">{warning.title}</span>
              <Badge variant={SEVERITY_VARIANT[warning.severity]}>{warning.severity}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{warning.metricLabel}</span>
              <span className="font-medium tabular-nums text-foreground">{warning.fromValue}</span>
              <TrendingUp className={cn('size-3.5', SEVERITY_VARIANT[warning.severity] === 'danger' ? 'text-danger' : 'text-warning')} />
              <span className="font-semibold tabular-nums text-danger">{warning.toValue}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{formatCompactCurrency(warning.revenueAtRisk)}</span> estimated
              revenue at risk
            </div>
            <div className="space-y-1 border-t border-border pt-2 text-xs">
              <div>
                <span className="text-muted-foreground">Possible cause — </span>
                <span className="text-foreground">{warning.cause}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Recommended action — </span>
                <span className="text-foreground">{warning.recommendedAction}</span>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {formatPercent(warning.confidence)} model confidence
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
