import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiCard } from '@/components/overview/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { ChartFrame, ChartLegend } from '@/components/charts/chart-frame'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import { getCustomer, getCustomerRecoverySummary, getCustomerPayments, getCustomerRecoveryActions } from '@/services/customer-service'
import { FAILURE_REASON_LABELS } from '@/types'

async function CustomerHeader({ customerId }: { customerId: string }) {
  const customer = await getCustomer(customerId)
  if (!customer) {
    notFound()
  }

  return (
    <SectionHeader
      title={customer.name}
      description={customer.email}
      actions={
        <>
          <Badge variant="neutral">{customer.segment}</Badge>
          <RiskBadge risk={customer.riskProfile} />
          <Badge variant="neutral">Demo mode — synthetic data</Badge>
        </>
      }
    />
  )
}

async function CustomerKpiCards({ customerId }: { customerId: string }) {
  const summary = await getCustomerRecoverySummary(customerId)
  if (!summary) return null

  const count = (v: number) => String(v)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard label="Total Payments" value={summary.totalPayments} formatValue={count} hint="payments" />
      <KpiCard
        label="Revenue At Risk"
        value={summary.totalAmountAtRisk}
        formatValue={formatCompactCurrency}
        accent="warning"
        hint="open payments"
      />
      <KpiCard
        label="Recovered Amount"
        value={summary.totalRecoveredAmount}
        formatValue={formatCompactCurrency}
        accent="success"
        emphasis
        hint={`of ${formatCompactCurrency(summary.totalAmount)}`}
      />
      <KpiCard
        label="Recovery Rate"
        value={summary.recoveryRate}
        formatValue={(v) => formatPercent(v, 1)}
        icon={summary.recoveryRate >= 0.5 ? undefined : undefined}
        hint="successes / attempts"
      />
      <KpiCard
        label="Pending Approvals"
        value={summary.pendingApprovals}
        formatValue={count}
        accent={summary.pendingApprovals > 0 ? 'warning' : 'success'}
        hint={summary.blockedPayments > 0 ? `${summary.blockedPayments} blocked` : undefined}
      />
    </div>
  )
}

async function CustomerTimeline({ customerId }: { customerId: string }) {
  const payments = await getCustomerPayments(customerId)
  const actions = await getCustomerRecoveryActions(customerId)

  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payment history"
        description="No payments are linked to this customer."
      />
    )
  }

  // Build a merged timeline from payments + recovery actions
  const timeline: {
    id: string
    type: 'payment' | 'action'
    timestamp: string
    title: string
    description: string
    status: string
  }[] = []

  for (const payment of payments) {
    timeline.push({
      id: payment.id,
      type: 'payment',
      timestamp: payment.createdAt,
      title: `Payment ${payment.id}`,
      description: `${payment.paymentMethodLabel} · ${formatCompactCurrency(payment.amount)}`,
      status: payment.status,
    })
  }

  // Add recovery actions with outcomes
  for (const action of actions) {
    const outcomeResult = action.status === 'completed' ? 'completed' : action.status
    timeline.push({
      id: action.id,
      type: 'action',
      timestamp: action.completedAt ?? action.scheduledAt,
      title: `Recovery action: ${action.type}`,
      description: action.notes ?? `${action.type} on ${action.channel}`,
      status: outcomeResult,
    })
  }

  timeline.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity timeline</CardTitle>
        <CardDescription>Chronological record of this customer's payments and recovery activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {timeline.map((event) => (
            <li key={event.id} className="flex gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {new Date(event.timestamp).toLocaleString()}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{event.title}</span>
                  <Badge variant={event.type === 'payment' ? 'primary' : 'ai'}>
                    {event.type}
                  </Badge>
                  <Badge variant={event.status === 'completed' || event.status === 'recovered' ? 'success' : event.status === 'failed' || event.status === 'blocked' ? 'danger' : 'warning'}>
                    {event.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

async function CustomerFailureBreakdown({ customerId }: { customerId: string }) {
  const summary = await getCustomerRecoverySummary(customerId)
  if (!summary || summary.failureReasons.length === 0) return null

  return (
    <ChartFrame
      title="Failure reasons"
      description="Breakdown of failure reasons for this customer's payments."
      isEmpty={false}
    >
      <BarChart
        labels={summary.failureReasons.map((f) => f.label)}
        series={[
          {
            key: 'count',
            label: 'Payments',
            color: 'var(--color-warning)',
            values: summary.failureReasons.map((f) => f.count),
          },
        ]}
        orientation="horizontal"
        valueFormatter={(v) => String(v)}
      />
    </ChartFrame>
  )
}

async function CustomerStrategyPerformance({ customerId }: { customerId: string }) {
  const summary = await getCustomerRecoverySummary(customerId)
  if (!summary || summary.strategiesUsed.length === 0) {
    return (
      <EmptyState
        title="No strategy data"
        description="No recovery outcomes recorded for this customer."
      />
    )
  }

  return (
    <ChartFrame
      title="Strategy performance"
      description="How different strategies have performed for this customer."
      isEmpty={false}
    >
      <BarChart
        labels={summary.strategiesUsed.map((s) => s.name)}
        series={[
          {
            key: 'successRate',
            label: 'Success rate',
            color: 'var(--color-success)',
            values: summary.strategiesUsed.map((s) => s.successRate),
          },
        ]}
        orientation="horizontal"
        valueFormatter={(v) => formatPercent(v, 0)}
      />
    </ChartFrame>
  )
}

async function CustomerChannelPerformance({ customerId }: { customerId: string }) {
  const summary = await getCustomerRecoverySummary(customerId)
  if (!summary || summary.channelsUsed.length === 0) {
    return (
      <EmptyState
        title="No channel data"
        description="No recovery outcomes recorded for this customer."
      />
    )
  }

  return (
    <ChartFrame
      title="Channel performance"
      description="Recovery success rate per channel for this customer."
      isEmpty={false}
    >
      <BarChart
        labels={summary.channelsUsed.map((c) => c.label)}
        series={[
          {
            key: 'successRate',
            label: 'Success rate',
            color: 'var(--color-primary)',
            values: summary.channelsUsed.map((c) => c.successRate),
          },
        ]}
        orientation="horizontal"
        valueFormatter={(v) => formatPercent(v, 0)}
      />
    </ChartFrame>
  )
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomer(id)
  if (!customer) {
    notFound()
  }

  return (
    <PageContainer>
      <Suspense fallback={<div>Loading…</div>}>
        <CustomerHeader customerId={id} />
      </Suspense>

      <Suspense fallback={<div>Loading…</div>}>
        <CustomerKpiCards customerId={id} />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<div>Loading…</div>}>
          <CustomerStrategyPerformance customerId={id} />
        </Suspense>
        <Suspense fallback={<div>Loading…</div>}>
          <CustomerChannelPerformance customerId={id} />
        </Suspense>
      </div>

      <Suspense fallback={<div>Loading…</div>}>
        <CustomerTimeline customerId={id} />
      </Suspense>
    </PageContainer>
  )
}