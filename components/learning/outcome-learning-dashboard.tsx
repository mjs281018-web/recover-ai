'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  GraduationCap,
  Lightbulb,
  Minus,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
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
import {
  getOutcomeLearningDashboard,
  type OutcomeLearningDashboard,
  type LearningSignal,
} from '@/services/analytics-service'

const IMPACT_ICON: Record<LearningSignal['impact'], React.ComponentType<{ className?: string }>> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
}

const IMPACT_VARIANT: Record<LearningSignal['impact'], 'success' | 'danger' | 'neutral'> = {
  positive: 'success',
  negative: 'danger',
  neutral: 'neutral',
}

const COLORS = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  ai: 'var(--color-ai)',
} as const

const count = (v: number) => String(Math.round(v))

export function OutcomeLearningDashboard({ initial }: { initial: OutcomeLearningDashboard }) {
  const [data, setData] = useState(initial)
  const event = useRuntimeEvents()

  useEffect(() => {
    let cancelled = false
    getOutcomeLearningDashboard().then((next) => {
      if (!cancelled) setData(next)
    })
    return () => {
      cancelled = true
    }
  }, [event])

  const { summary, strategyLearning, channelLearning, failureReasonLearning, recentOutcomes, signals, predictions, modelUpdates } = data

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Outcome Learning"
        description="How recovery outcomes feed back into strategy ranking and future decisions. All figures are computed live from recorded outcomes."
        actions={
          <>
            <Badge variant="success">
              <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-current" />
              Live
            </Badge>
            <Badge variant="ai">Outcome-based learning</Badge>
            <Badge variant="neutral">Demo mode — synthetic data</Badge>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Attempts" value={summary.totalAttempts} formatValue={count} icon={BarChart3} hint="recorded outcomes" />
        <KpiCard label="Successes" value={summary.successes} formatValue={count} icon={CheckCircle2} accent="success" hint="recovered" />
        <KpiCard label="Failures" value={summary.failures} formatValue={count} icon={XCircle} accent="danger" hint="failed recoveries" />
        <KpiCard label="Overall Success Rate" value={summary.overallSuccessRate} formatValue={(v) => formatPercent(v, 1)} icon={Target} hint="successes / attempts" />
        <KpiCard label="Recovered Revenue" value={summary.totalRecoveredRevenue} formatValue={formatCompactCurrency} icon={TrendingUp} accent="success" hint="from successes" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Strategy performance"
          description="Measured success rate from recorded outcomes. Unmeasured strategies show their catalog default."
          isEmpty={strategyLearning.length === 0}
          empty={<EmptyState title="No strategy data" description="Run recoveries to attribute outcomes to strategies." />}
        >
          <BarChart
            labels={strategyLearning.map((s) => s.name)}
            series={[
              {
                key: 'successRate',
                label: 'Success rate',
                color: COLORS.success,
                values: strategyLearning.map((s) => s.successRate),
              },
            ]}
            orientation="horizontal"
            valueFormatter={(v) => formatPercent(v, 0)}
          />
          <ChartLegend items={[{ label: 'Measured from outcomes', color: COLORS.success }]} />
          <ul className="mt-4 space-y-1 text-sm">
            {strategyLearning.map((s) => (
              <li key={s.strategyId} className="flex justify-between text-muted-foreground">
                <span>{s.name}</span>
                <span>
                  {s.measured ? `${s.successes}/${s.attempts}` : 'catalog'} · {formatPercent(s.successRate, 0)}
                </span>
              </li>
            ))}
          </ul>
        </ChartFrame>

        <ChartFrame
          title="Channel performance"
          description="Recovery success rate per channel across recorded outcomes."
          isEmpty={channelLearning.every((c) => c.attempts === 0)}
          empty={<EmptyState title="No channel data" description="No outcomes recorded yet." />}
        >
          <BarChart
            labels={channelLearning.map((c) => c.label)}
            series={[
              {
                key: 'successRate',
                label: 'Success rate',
                color: COLORS.primary,
                values: channelLearning.map((c) => c.successRate),
              },
            ]}
            valueFormatter={(v) => formatPercent(v, 0)}
          />
          <ChartLegend items={[{ label: 'Success rate', color: COLORS.primary }]} />
          <ul className="mt-4 space-y-1 text-sm">
            {channelLearning.map((c) => (
              <li key={c.channel} className="flex justify-between text-muted-foreground">
                <span>{c.label}</span>
                <span>
                  {c.attempts > 0 ? `${c.successes}/${c.attempts}` : 'no data'} · {formatCompactCurrency(c.recoveredRevenue)}
                </span>
              </li>
            ))}
          </ul>
        </ChartFrame>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Failure reason outcomes"
          description="Recovery success grouped by the root failure reason."
          isEmpty={failureReasonLearning.length === 0}
          empty={<EmptyState title="No failure data" description="No outcomes recorded yet." />}
        >
          <BarChart
            labels={failureReasonLearning.map((f) => f.label)}
            series={[
              {
                key: 'successRate',
                label: 'Success rate',
                color: COLORS.warning,
                values: failureReasonLearning.map((f) => f.successRate),
              },
            ]}
            valueFormatter={(v) => formatPercent(v, 0)}
          />
          <ChartLegend items={[{ label: 'Success rate', color: COLORS.warning }]} />
        </ChartFrame>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Lightbulb className="size-4 text-ai" />
              Learning signals
            </CardTitle>
            <CardDescription>Adaptive signals derived from recent outcome patterns.</CardDescription>
          </CardHeader>
          <CardContent>
            {signals.length === 0 ? (
              <EmptyState title="No signals yet" description="Run recoveries to generate learning signals." />
            ) : (
              <ul className="space-y-3">
                {signals.map((signal) => {
                  const Icon = IMPACT_ICON[signal.impact]
                  return (
                    <li key={signal.id} className="flex gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{signal.message}</span>
                          <Badge variant={IMPACT_VARIANT[signal.impact]}>{signal.impact}</Badge>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Clock className="size-4 text-muted-foreground" />
            Recent outcomes
          </CardTitle>
          <CardDescription>Most recent recovery outcomes across the demo store.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOutcomes.length === 0 ? (
            <EmptyState title="No outcomes yet" description="Recovery attempts will appear here." />
          ) : (
            <div className="space-y-2">
              {recentOutcomes.map((outcome) => (
                <div key={outcome.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                      {outcome.result === 'recovered' ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : outcome.result === 'failed' ? (
                        <XCircle className="size-4 text-danger" />
                      ) : (
                        <Clock className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{outcome.paymentId}</div>
                      <div className="text-xs text-muted-foreground">
                        {outcome.customerName} · {outcome.action} · {outcome.channel}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {outcome.amountRecovered ? formatCompactCurrency(outcome.amountRecovered) : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      of {formatCompactCurrency(outcome.paymentAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Target className="size-4 text-ai" />
              Recent predictions
            </CardTitle>
            <CardDescription>What the model estimated and which signals drove it.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {predictions.length === 0 ? (
              <EmptyState title="No predictions yet" description="Prediction records will appear here." />
            ) : (
              predictions.slice(0, 4).map((prediction) => (
                <div key={prediction.id} className="space-y-2 rounded-lg border border-border bg-surface/40 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{prediction.paymentId}</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      confidence {formatPercent(prediction.confidence)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-ai"
                        style={{ width: `${Math.round(prediction.recoveryProbability * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{formatPercent(prediction.recoveryProbability)}</span>
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                    {prediction.factors.slice(0, 3).map((factor, i) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <GraduationCap className="size-4 text-ai" />
              Model updates
            </CardTitle>
            <CardDescription>Learning events emitted by the agent.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {modelUpdates.length === 0 ? (
              <EmptyState title="No updates yet" description="Learning events will appear here." />
            ) : (
              modelUpdates.slice(0, 5).map((event) => (
                <div key={event.id} className="flex flex-col gap-0.5 border-l-2 border-ai/30 pl-3">
                  <span className="text-sm font-medium text-foreground">{event.title}</span>
                  <span className="text-xs text-muted-foreground">{event.description}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}