'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  Bot,
  CheckCircle2,
  Gauge,
  Lightbulb,
  OctagonAlert as AlertOctagon,
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
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recovery insights</CardTitle>
            <CardDescription>Live signals computed ahead of the seeded narratives.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.insights.length === 0 ? (
              <EmptyState title="No insights yet" description="Run a recovery to generate live signals." />
            ) : (
              <ul className="space-y-3">
                {dashboard.insights.map((insight) => {
                  const Icon = CATEGORY_ICON[insight.category] ?? Lightbulb
                  return (
                    <li key={insight.id} className="flex gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{insight.title}</span>
                          <Badge variant={IMPACT_VARIANT[insight.impact]}>{insight.impact}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery by channel</CardTitle>
            <CardDescription>Live recovery rate per payment channel.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.byChannel.length === 0 ? (
              <EmptyState title="No channel data" description="No payments recorded yet." />
            ) : (
              <>
                <BarChart
                  labels={dashboard.byChannel.map((c) => c.label)}
                  series={[
                    {
                      key: 'recoveryRate',
                      label: 'Recovery rate',
                      color: COLORS.success,
                      values: dashboard.byChannel.map((c) => c.recoveryRate),
                    },
                  ]}
                  orientation="horizontal"
                  valueFormatter={(v) => formatPercent(v, 0)}
                />
                <ul className="mt-4 space-y-1 text-sm">
                  {dashboard.byChannel.map((c) => (
                    <li key={c.channel} className="flex justify-between text-muted-foreground">
                      <span>{c.label}</span>
                      <span>
                        {c.recovered}/{c.total} · {formatCompactCurrency(c.revenueRecovered)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Recovery by failure reason"
          description="Revenue impact per failure reason across the open payment queue."
          isEmpty={dashboard.failureBreakdown.length === 0}
          empty={<EmptyState title="No failure data" description="No payments recorded yet." />}
        >
          <BarChart
            labels={dashboard.failureBreakdown.map((f) => f.label)}
            series={[
              {
                key: 'revenueImpact',
                label: 'Revenue at risk',
                color: COLORS.warning,
                values: dashboard.failureBreakdown.map((f) => f.revenueImpact),
              },
            ]}
            orientation="horizontal"
            valueFormatter={formatCompactCurrency}
          />
        </ChartFrame>

        <ChartFrame
          title="Strategy performance"
          description="Attempts vs recovered per strategy. Unmeasured strategies show catalog coverage."
          isEmpty={dashboard.strategyPerformance.length === 0}
          empty={<EmptyState title="No strategy data" description="No strategies recorded yet." />}
        >
          <BarChart
            labels={dashboard.strategyPerformance.map((s) => s.name)}
            series={[
              {
                key: 'attempts',
                label: 'Attempts',
                color: COLORS.primary,
                values: dashboard.strategyPerformance.map((s) => s.attempts),
              },
              {
                key: 'recovered',
                label: 'Recovered',
                color: COLORS.success,
                values: dashboard.strategyPerformance.map((s) => s.recovered),
              },
            ]}
            valueFormatter={(v) => String(Math.round(v))}
          />
          <ChartLegend items={[
            { label: 'Attempts', color: COLORS.primary },
            { label: 'Recovered', color: COLORS.success },
          ]} />
        </ChartFrame>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartFrame
          title="Customer segment risk"
          description="Revenue at risk per customer segment."
          isEmpty={dashboard.segmentRisk.length === 0}
          empty={<EmptyState title="No segment data" description="No payments recorded yet." />}
        >
          <BarChart
            labels={dashboard.segmentRisk.map((s) => s.segment)}
            series={[
              {
                key: 'revenueAtRisk',
                label: 'Revenue at risk',
                color: COLORS.warning,
                values: dashboard.segmentRisk.map((s) => s.revenueAtRisk),
              },
            ]}
            valueFormatter={formatCompactCurrency}
          />
        </ChartFrame>

        <ChartFrame
          title="Probability distribution"
          description="Open payments bucketed by recovery probability."
          isEmpty={dashboard.probabilityDistribution.length === 0}
          empty={<EmptyState title="No probability data" description="No payments recorded yet." />}
        >
          <BarChart
            labels={dashboard.probabilityDistribution.map((p) => p.bucketLabel)}
            series={[
              {
                key: 'count',
                label: 'Payments',
                color: COLORS.primary,
                values: dashboard.probabilityDistribution.map((p) => p.paymentCount),
              },
            ]}
            valueFormatter={(v) => String(Math.round(v))}
          />
        </ChartFrame>

        <ChartFrame
          title="Expected vs actual"
          description="Seeded weekly history plus the live 'Now' point."
          isEmpty={dashboard.expectedVsActual.length === 0}
          empty={<EmptyState title="No outcome data" description="No outcomes recorded yet." />}
        >
          <BarChart
            labels={dashboard.expectedVsActual.map((p) => p.label)}
            series={[
              {
                key: 'expected',
                label: 'Expected',
                color: COLORS.primary,
                values: dashboard.expectedVsActual.map((p) => p.expected),
              },
              {
                key: 'actual',
                label: 'Actual',
                color: COLORS.success,
                values: dashboard.expectedVsActual.map((p) => p.actual),
              },
            ]}
            valueFormatter={formatCompactCurrency}
          />
          <ChartLegend items={[
            { label: 'Expected', color: COLORS.primary },
            { label: 'Actual', color: COLORS.success },
          ]} />
        </ChartFrame>
      </div>
    </div>
  )
}