'use client'

import { useState } from 'react'
import { TrendingUp, ShieldAlert, Wallet, Percent, Sparkles, Zap, ShieldCheck, ShieldOff, Timer } from 'lucide-react'
import { PageContainer } from '@/components/foundation/page-container'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import { paymentStatusKey } from '@/lib/status'
import { DEMO_BANNER } from '@/data/demo'

import { KpiCard } from '@/components/overview/kpi-card'
import { AutonomyStatusIndicator } from '@/components/overview/status-indicator'
import { RecoveryFunnel } from '@/components/overview/recovery-funnel'
import { LiveRecoveryDemo } from '@/components/overview/live-recovery-demo'
import { AgentStateMachine, type PipelineStageKey } from '@/components/overview/agent-state-machine'
import { AgentActivityFeed } from '@/components/overview/agent-activity-feed'
import { EarlyWarningCard } from '@/components/overview/early-warning-card'
import { RootCauseCard } from '@/components/overview/root-cause-card'
import { ForecastCard } from '@/components/overview/forecast-card'
import { RevenueTrendChart } from '@/components/overview/revenue-trend-chart'
import { FailureBreakdownCard } from '@/components/overview/failure-breakdown-card'
import { ChartFrame } from '@/components/charts/chart-frame'
import { BarChart } from '@/components/charts/bar-chart'
import { computeLiveMetrics } from '@/services/analytics-service'

import type {
  AgentEvent,
  ChannelPerformance,
  EarlyWarning,
  ExpectedVsActualPoint,
  FailureReasonBreakdown,
  Payment,
  ProbabilityBucket,
  RecoveryForecast,
  RecoveryFunnelStage,
  RevenueTrendPoint,
  RootCauseInsight,
  SecondaryMetrics,
  SegmentRisk,
  InterventionPerformance,
} from '@/types'

interface HeadlineMetrics {
  revenueAtRisk: number
  recoverableRevenue: number
  revenueRecovered: number
  recoveryRate: number
  recoveryRateDelta: number
  pendingApprovals: number
  activeAgentActions: number
}

export interface OverviewClientProps {
  metrics: HeadlineMetrics
  secondaryMetrics: SecondaryMetrics
  funnel: RecoveryFunnelStage[]
  revenueTrend90d: RevenueTrendPoint[]
  failureBreakdown: FailureReasonBreakdown[]
  channelPerformance: ChannelPerformance[]
  interventionPerformance: InterventionPerformance[]
  probabilityDistribution: ProbabilityBucket[]
  expectedVsActual: ExpectedVsActualPoint[]
  segmentRisk: SegmentRisk[]
  forecast: RecoveryForecast
  earlyWarnings: EarlyWarning[]
  rootCauses: RootCauseInsight[]
  agentEvents: AgentEvent[]
  recentPayments: Payment[]
}

/** Small sparkline history for KPI cards, derived from the daily trend so cards feel alive. */
function trailingSeries(trend: RevenueTrendPoint[], key: keyof Pick<RevenueTrendPoint, 'atRisk' | 'recoverable' | 'recovered'>, days = 14) {
  return trend.slice(-days).map((p) => p[key])
}

export function OverviewClient({
  metrics,
  secondaryMetrics,
  funnel,
  revenueTrend90d,
  failureBreakdown,
  channelPerformance,
  interventionPerformance,
  probabilityDistribution,
  expectedVsActual,
  segmentRisk,
  forecast,
  earlyWarnings,
  rootCauses,
  agentEvents,
  recentPayments,
}: OverviewClientProps) {
  const [session, setSession] = useState(() => {
    // Derive revenue KPIs from the live in-memory store (the same store the
    // agent simulation mutates) so they reflect actual recoveries instead of
    // the server-rendered static snapshot. Secondary stats stay seed-based.
    const live = computeLiveMetrics()
    return {
      revenueAtRisk: live.revenueAtRisk,
      recoverableRevenue: live.recoverableRevenue,
      revenueRecovered: live.revenueRecovered,
      recoveryRate: live.recoveryRate,
      aiActionsExecuted: secondaryMetrics.aiActionsExecuted,
      humanEscalations: secondaryMetrics.humanEscalations,
      safetyBlocks: secondaryMetrics.safetyBlocks,
      averageRecoveryTimeMinutes: secondaryMetrics.averageRecoveryTimeMinutes,
    }
  })
  const [funnelState, setFunnelState] = useState<RecoveryFunnelStage[]>(funnel)
  const [pulseKey, setPulseKey] = useState<string | undefined>(undefined)
  const [activeStage, setActiveStage] = useState<PipelineStageKey | null>(null)
  const [liveEvents, setLiveEvents] = useState<AgentEvent[]>([])

  const combinedAgentEvents = [...liveEvents, ...agentEvents].slice(0, 8)

  function handleDemoComplete(amount: number) {
    setSession((prev) => {
      const revenueRecovered = prev.revenueRecovered + amount
      // Mirrors the live formula ("recovered ÷ recovered + at risk") used by
      // computeLiveMetrics so the demo button and the KPIs stay consistent.
      const totalConsidered = revenueRecovered + prev.revenueAtRisk
      const recoveryRate = totalConsidered > 0 ? revenueRecovered / totalConsidered : prev.recoveryRate
      return { ...prev, revenueRecovered, recoveryRate, aiActionsExecuted: prev.aiActionsExecuted + 1 }
    })
    setFunnelState((prev) =>
      prev.map((stage) =>
        stage.key === 'recovered'
          ? { ...stage, paymentCount: stage.paymentCount + 1, revenue: stage.revenue + amount }
          : stage,
      ),
    )
    setPulseKey('recovered')
    setTimeout(() => setPulseKey(undefined), 1800)
    setLiveEvents((prev) =>
      [
        {
          id: `live-${Date.now()}`,
          kind: 'action' as const,
          title: 'Live demo: payment recovered',
          description: `Retried and recovered ${formatCompactCurrency(amount)} over UPI.`,
          confidence: 0.92,
          timestamp: 'Just now',
        },
        ...prev,
      ].slice(0, 4),
    )
  }

  return (
    <PageContainer className="max-w-[1400px]">
      <SectionHeader
        title="Revenue Recovery Command Center"
        description="AI-powered detection, decisioning and recovery of at-risk revenue."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{DEMO_BANNER}</Badge>
            <AutonomyStatusIndicator active />
          </div>
        }
      />

      {/* Primary KPIs — the first thing a judge should read */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue At Risk"
          value={session.revenueAtRisk}
          formatValue={formatCompactCurrency}
          icon={ShieldAlert}
          accent="danger"
          hint="across open payments"
          sparklineData={trailingSeries(revenueTrend90d, 'atRisk')}
        />
        <KpiCard
          label="Recoverable Revenue"
          value={session.recoverableRevenue}
          formatValue={formatCompactCurrency}
          icon={Wallet}
          accent="warning"
          hint="model-estimated"
          sparklineData={trailingSeries(revenueTrend90d, 'recoverable')}
        />
        <KpiCard
          label="Revenue Recovered"
          value={session.revenueRecovered}
          formatValue={formatCompactCurrency}
          icon={TrendingUp}
          accent="success"
          delta={metrics.recoveryRateDelta}
          hint="this month"
          sparklineData={trailingSeries(revenueTrend90d, 'recovered')}
          emphasis
        />
        <KpiCard
          label="Recovery Rate"
          value={session.recoveryRate * 100}
          formatValue={(v) => formatPercent(v / 100, 1)}
          icon={Percent}
          accent="ai"
          delta={metrics.recoveryRateDelta}
          hint="vs last month"
        />
      </div>

      {/* Secondary operational metrics */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-6 p-5 sm:grid-cols-4">
          <SecondaryStat icon={Zap} label="AI Actions Executed" value={session.aiActionsExecuted.toLocaleString('en-IN')} />
          <SecondaryStat icon={ShieldCheck} label="Human Escalations" value={session.humanEscalations.toLocaleString('en-IN')} />
          <SecondaryStat icon={ShieldOff} label="Safety Blocks" value={session.safetyBlocks.toLocaleString('en-IN')} />
          <SecondaryStat icon={Timer} label="Avg. Recovery Time" value={`${session.averageRecoveryTimeMinutes}m`} />
        </CardContent>
      </Card>

      {/* The recovery funnel — the core business story, above the fold */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery funnel</CardTitle>
          <CardDescription>How every at-risk payment moves toward recovered revenue. Hover a stage for detail.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <RecoveryFunnel stages={funnelState} pulseKey={pulseKey} />
        </CardContent>
      </Card>

      {/* Live recovery demo — the competition centerpiece */}
      <LiveRecoveryDemo onStageChange={setActiveStage} onComplete={handleDemoComplete} />

      {/* AI agent panel + governance context */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="flex flex-col xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-ai" />
              RecoverAI agent
            </CardTitle>
            <CardDescription>The autonomous pipeline the recovery agent runs for every at-risk payment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-5 pt-0">
            <AgentStateMachine activeStage={activeStage} />
            <div className="border-t border-border pt-1">
              <AgentActivityFeed events={combinedAgentEvents} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <EarlyWarningCard warnings={earlyWarnings} />
        </div>
      </div>

      <RootCauseCard insights={rootCauses} />

      {/* Trend + forecast */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <RevenueTrendChart trend90d={revenueTrend90d} className="xl:col-span-3" />
        <ForecastCard forecast={forecast} className="xl:col-span-2" />
      </div>

      {/* Failure + performance analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FailureBreakdownCard breakdown={failureBreakdown} />

        <ChartFrame
          title="Recovery performance by failure reason"
          description="Recovery rate once the agent takes action, by root cause."
        >
          <BarChart
            orientation="horizontal"
            labels={failureBreakdown.map((f) => f.label)}
            series={[{ key: 'rate', label: 'Recovery rate', color: 'var(--color-ai)', values: failureBreakdown.map((f) => f.recoveryRate * 100) }]}
            valueFormatter={(v) => `${Math.round(v)}%`}
          />
        </ChartFrame>

        <ChartFrame
          title="Recovery rate by payment method"
          description="Failure rate vs. recovery rate across UPI, cards, net banking, and wallets."
        >
          <BarChart
            labels={channelPerformance.map((c) => c.label)}
            series={[
              { key: 'failure', label: 'Failure rate', color: 'var(--color-danger)', values: channelPerformance.map((c) => c.failureRate * 100) },
              { key: 'recovery', label: 'Recovery rate', color: 'var(--color-success)', values: channelPerformance.map((c) => c.recoveryRate * 100) },
            ]}
            valueFormatter={(v) => `${Math.round(v)}%`}
          />
        </ChartFrame>

        <ChartFrame
          title="AI intervention performance"
          description="How retry, reminder, and escalation compare once the agent commits to them."
        >
          <BarChart
            labels={interventionPerformance.map((i) => i.label)}
            series={[{ key: 'rate', label: 'Recovery rate', color: 'var(--color-ai)', values: interventionPerformance.map((i) => i.recoveryRate * 100) }]}
            valueFormatter={(v) => `${Math.round(v)}%`}
          />
        </ChartFrame>

        <ChartFrame
          title="Revenue at risk by customer segment"
          description="Where open exposure concentrates across consumer, SME, and enterprise accounts."
        >
          <BarChart
            labels={segmentRisk.map((s) => s.label)}
            series={[{ key: 'risk', label: 'Revenue at risk', color: 'var(--color-warning)', values: segmentRisk.map((s) => s.revenueAtRisk) }]}
            valueFormatter={formatCompactCurrency}
          />
        </ChartFrame>

        <ChartFrame
          title="Expected vs. actual recovery"
          description="Model-expected recovery against what actually landed, by week."
        >
          <BarChart
            labels={expectedVsActual.map((e) => e.label)}
            series={[
              { key: 'expected', label: 'Expected', color: 'var(--color-ai)', values: expectedVsActual.map((e) => e.expected) },
              { key: 'actual', label: 'Actual', color: 'var(--color-success)', values: expectedVsActual.map((e) => e.actual) },
            ]}
            valueFormatter={formatCompactCurrency}
          />
        </ChartFrame>

        <ChartFrame
          title="Recovery probability distribution"
          description="How the model's confidence is spread across all 10,000 at-risk payments."
        >
          <BarChart
            labels={probabilityDistribution.map((b) => b.bucketLabel)}
            series={[{ key: 'count', label: 'Payments', color: 'var(--color-primary)', values: probabilityDistribution.map((b) => b.paymentCount) }]}
            valueFormatter={(v) => v.toLocaleString('en-IN')}
          />
        </ChartFrame>
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
          <CardDescription>Latest synthetic transactions across every channel and status.</CardDescription>
        </CardHeader>
        <PreviewTable columns={['Payment', 'Customer', 'Amount', 'Status']}>
          {recentPayments.map((payment) => (
            <PreviewRow key={payment.id}>
              <PreviewCell className="font-mono text-xs text-muted-foreground">{payment.id}</PreviewCell>
              <PreviewCell>{payment.customerName}</PreviewCell>
              <PreviewCell className="tabular-nums">{formatCompactCurrency(payment.amount)}</PreviewCell>
              <PreviewCell>
                <StatusBadge status={paymentStatusKey(payment.status)} />
              </PreviewCell>
            </PreviewRow>
          ))}
        </PreviewTable>
      </Card>
    </PageContainer>
  )
}

function SecondaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="space-y-0.5">
        <div className="text-sm font-semibold tabular-nums text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
