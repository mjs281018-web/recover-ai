import { TrendingUp, TrendingDown, Lightbulb, AlertOctagon } from 'lucide-react'
import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPercent } from '@/lib/format'
import { listInsights, getRecoveryRateByChannel } from '@/services/analytics-service'
import type { RecoveryInsight } from '@/types'

const CATEGORY_ICON: Record<RecoveryInsight['category'], React.ComponentType<{ className?: string }>> = {
  trend: TrendingUp,
  anomaly: AlertOctagon,
  opportunity: Lightbulb,
  risk: TrendingDown,
}

const IMPACT_VARIANT: Record<RecoveryInsight['impact'], 'success' | 'warning' | 'danger'> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
}

export default async function AnalyticsPage() {
  const [insights, byChannel] = await Promise.all([listInsights(), getRecoveryRateByChannel()])

  return (
    <PageContainer>
      <SectionHeader
        title="Analytics"
        description="Recovery performance trends, channel breakdowns, and insights the agent has surfaced."
        actions={<Badge variant="neutral">{insights.length} insights</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recovery insights</CardTitle>
            <CardDescription>Trends, anomalies, and opportunities generated from recent activity.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {insights.map((insight) => {
              const Icon = CATEGORY_ICON[insight.category]
              return (
                <div key={insight.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                  <Badge variant={IMPACT_VARIANT[insight.impact]} className="shrink-0 capitalize">
                    {insight.impact}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery rate by channel</CardTitle>
            <CardDescription>Share of synthetic payments recovered per channel.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {byChannel.map((row) => (
              <div key={row.channel} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-foreground">{row.channel}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.recovered}/{row.total} · {formatPercent(row.rate)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${row.rate * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
