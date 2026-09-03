'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  Bot,
  Lightbulb,
  CheckCircle2,
  OctagonAlert as AlertOctagon,
  Gauge,
  ShieldAlert,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiCard } from '@/components/overview/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { ChartFrame, ChartLegend } from '@/components/charts/chart-frame'
import { useRuntimeEvents } from '@/lib/use-runtime-events'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import { getAnalyticsDashboard, type LiveAnalyticsDashboard } from '@/services/analytics-service'
import type { RecoveryInsight } from '@/types'

const CATEGORY_ICON: Record<RecoveryInsight['category'], React.ComponentType<{ className?: string }>> = {
  trend: TrendingUp,
  anomaly: AlertOctagon,
  opportunity: Lightbulb,
  risk: TrendingDown,
}

const IMPACT_VARIANT: Record<RecoveryInsight['impact'], 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}

const COLORS = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  ai: 'var(--color-ai)',
} as const

const count = (v: number) => String(Math.round(v))

export function AnalyticsDashboard({ initial }: { initial: LiveAnalyticsDashboard }) {
  const [dashboard, setDashboard] = useState(initial)
  const event = useRuntimeEvents()

  useEffect(() => {
    let cancelled = false
    getAnalyticsDashboard().then((next) => {
      if (!cancelled) setDashboard(next)
    })
    return () => {
      cancelled = true
    }
  }, [event])

  const { overview } = dashboard

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics"
        description="Recovery performance computed live from the demo store — payments, outcomes, approvals, policy blocks and batch results. Every figure updates as the agent runs."
        actions={
          <>
            <Badge variant="success">
              <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-current" />
              Live
            </Badge>
            <Badge variant="neutral">Demo mode — synthetic data</Badge>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Revenue At Risk" value={overview.revenueAtRisk} formatValue={formatCompactCurrency} icon={AlertTriangle} accent="warning" hint="open payments" />
        <KpiCard label="Recoverable Revenue" value={overview.recoverableRevenue} formatValue={formatCompactCurrency} icon={Target} hint="probability-weighted" />
        <KpiCard label="Revenue Recovered" value={overview.revenueRecovered} formatValue={formatCompactCurrency} icon={Banknote} accent="success" emphasis hint="current store" />
        <KpiCard label="Recovery Rate" value={overview.recoveryRate} formatValue={(v) => formatPercent(v, 1)} icon={Gauge} hint="of considered revenue" />
        <KpiCard label="Avg Recovery Time" value={overview.averageRecoveryTimeMinutes} formatValue={(v) => `${Math.round(v)}m`} icon={Timer} hint="attempt to verify" />
        <KpiCard label="Successful Recoveries" value={overview.successfulRecoveries} formatValue={count} icon={CheckCircle2} accent="success" hint="payments recovered" />
        <KpiCard label="Failed Recoveries" value={overview.failedRecoveries} formatValue={count} icon={XCircle} accent="danger" hint="recorded outcomes" />
        <KpiCard label="AI Actions" value={overview.aiActionsExecuted} formatValue={count} icon={Bot} accent="ai" hint="agent decisions" />
        <KpiCard label="Human Escalations" value={overview.humanEscalations} formatValue={count} icon={Users} accent="warning" hint={`${overview.pendingApprovals} pending`} />
        <KpiCard label="Safety Blocks" value={overview.safetyBlocks} formatValue={count} icon={ShieldAlert} accent="danger" hint="policy-blocked" />
      </div>
      {/* Preserved sections — insights + channel rates, now computed live. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recovery insights</CardTitle>
            <CardDescription>Signals computed from the current store, ahead of the seeded analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.insights.length === 0 ? (
              <EmptyState
                title="No insights yet"
                description="Insights appear as recovery state changes."
              />
            ) : (
              dashboard.insights.map((insight) => {
                const Icon = CATEGORY_ICON[insight.category]
                return (
                  <div key={insight.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{insight.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
                    </div>
                    <Badge variant={IMPACT_VARIANT[insight.impact]} className="shrink-0 capitalize">
                      {insight.impact}
                    </Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery rate by channel</CardTitle>
            <CardDescription>Share of demo payments recovered per channel, computed live.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {dashboard.byChannel.length === 0 ? (
              <EmptyState
                title="No channel data yet"
                description="Recover a payment to populate channel analytics."
              />
            ) : (
              dashboard.byChannel.map((row) => (
                <div key={row.channel} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-foreground">{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.recovered}/{row.total} · {formatPercent(row.recoveryRate)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${row.recoveryRate * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartFrame
          title="Recovery by failure reason"
          description="Revenue impact of each failure reason across current payments."
        >
          {dashboard.failureBreakdown.length === 0 ? (
            <EmptyState
              title="No failure data yet"
              description="Failed payments will break down by reason here."
            />
          ) : (
            <BarChart
              orientation="horizontal"
              labels={dashboard.failureBreakdown.map((row) => row.label)}
              series={[
                {
                  key: 'revenue-impact',
                  label: 'Revenue impact',
                  color: COLORS.warning,
                  values: dashboard.failureBreakdown.map((row) => row.revenueImpact),
                },
              ]}
              valueFormatter={formatCompactCurrency}
            />
          )}
        </ChartFrame>

        <ChartFrame
          title="Strategy performance"
          description="Attempts and recoveries per strategy from recorded outcomes."
          legend={
            <ChartLegend
              items={[
                { label: 'Attempts', color: COLORS.ai },
                { label: 'Recovered', color: COLORS.success },
              ]}
            />
          }
        >
          <BarChart
            orientation="horizontal"
            labels={dashboard.strategyPerformance.map((strategy) => strategy.name)}
            series={[
              {
                key: 'attempts',
                label: 'Attempts',
                color: COLORS.ai,
                values: dashboard.strategyPerformance.map((strategy) => strategy.attempts),
              },
              {
                key: 'recovered',
                label: 'Recovered',
                color: COLORS.success,
                values: dashboard.strategyPerformance.map((strategy) => strategy.recovered),
              },
            ]}
            valueFormatter={count}
          />
        </ChartFrame>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartFrame
          title="Customer segment risk"
          description="Open revenue at risk by customer segment."
        >
          {dashboard.segmentRisk.length === 0 ? (
            <EmptyState
              title="No open at-risk revenue"
              description="Segment risk appears while payments await recovery."
            />
          ) : (
            <BarChart
              orientation="vertical"
              labels={dashboard.segmentRisk.map((row) => row.label)}
              series={[
                {
                  key: 'revenue-at-risk',
                  label: 'Revenue at risk',
                  color: COLORS.warning,
                  values: dashboard.segmentRisk.map((row) => row.revenueAtRisk),
                },
              ]}
              valueFormatter={formatCompactCurrency}
            />
          )}
        </ChartFrame>

        <ChartFrame
          title="Probability distribution"
          description="Recovery-probability estimates across current payments."
        >
          {dashboard.probabilityDistribution.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="The histogram appears once payments exist."
            />
          ) : (
            <BarChart
              orientation="vertical"
              labels={dashboard.probabilityDistribution.map((bucket) => bucket.bucketLabel)}
              series={[
                {
                  key: 'payments',
                  label: 'Payments',
                  color: COLORS.primary,
                  values: dashboard.probabilityDistribution.map((bucket) => bucket.paymentCount),
                },
              ]}
              valueFormatter={count}
            />
          )}
        </ChartFrame>
      </div>

      <ChartFrame
        title="Expected vs actual recovery"
        description="Seeded six-week history plus a live 'Now' point computed from current outcomes."
        legend={
          <ChartLegend
            items={[
              { label: 'Expected', color: COLORS.primary },
              { label: 'Actual', color: COLORS.success },
            ]}
          />
        }
      >
        <BarChart
          orientation="vertical"
          labels={dashboard.expectedVsActual.map((point) => point.label)}
          series={[
            {
              key: 'expected',
              label: 'Expected',
              color: COLORS.primary,
              values: dashboard.expectedVsActual.map((point) => point.expected),
            },
            {
              key: 'actual',
              label: 'Actual',
              color: COLORS.success,
              values: dashboard.expectedVsActual.map((point) => point.actual),
            },
          ]}
          valueFormatter={formatCompactCurrency}
        />
      </ChartFrame>
    </div>
  )
}