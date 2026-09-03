/**
 * Analytics service — headline metrics and generated insights for the
 * command center and analytics pages. Wraps synthetic demo data; a real
 * implementation would aggregate from the payments/recovery datastore.
 */
import type {
  ChannelPerformance,
  CustomerSegment,
  ExpectedVsActualPoint,
  FailureReason,
  FailureReasonBreakdown,
  PaymentStatus,
  ProbabilityBucket,
  RecoveryActionStatus,
  RecoveryChannel,
  RecoveryInsight,
  RecoveryStrategy,
  RevenueTrendPoint,
  SegmentRisk,
} from '@/types'
import { FAILURE_REASON_LABELS } from '@/types'
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format'
import {
  demoMetrics,
  demoApprovals,
  demoSecondaryMetrics,
  demoRecoveryActions,
  demoRecoveryOutcomes,
  demoInsights,
  demoPayments,
  demoStrategies,
  demoRevenueTrend90d,
  demoFailureBreakdown,
  demoChannelPerformance,
  demoInterventionPerformance,
  demoProbabilityDistribution,
  demoExpectedVsActual,
  demoSegmentRisk,
  demoRecoveryForecast,
  demoEarlyWarnings,
  demoRootCauses,
  demoRecoveryFunnel,
} from '@/data/demo'

// ---------------------------------------------------------------------------
// Live headline metrics
// ---------------------------------------------------------------------------
// Derived directly from the current in-memory demo store (payments, approvals,
// recovery actions, and outcomes) so every value reflects the actual state of
// the synthetic dataset instead of the hard-coded `demoMetrics` snapshot.
// ---------------------------------------------------------------------------

export interface LiveDashboardMetrics {
  revenueAtRisk: number
  recoverableRevenue: number
  revenueRecovered: number
  recoveryRate: number
  recoveryRateDelta: number
  pendingApprovals: number
  activeAgentActions: number
  /** Payments observed by the agent in the current dataset. */
  paymentsAnalyzed: number
  /** Payments whose current status is recovered. */
  successfulRecoveries: number
  /** Recovery attempts recorded in the outcome store. */
  aiActionsExecuted: number
}

/** Open payments that are still candidates for recovery (not failed or governance-blocked). */
const OPEN_RISK_STATUSES: ReadonlySet<PaymentStatus> = new Set(['at-risk', 'in-progress', 'pending-approval'])

/** Recovery actions the agent is still working on. */
const ACTIVE_ACTION_STATUSES: ReadonlySet<RecoveryActionStatus> = new Set(['queued', 'in-progress', 'awaiting-approval'])

/** Recovery-rate trend vs ~30 days ago, derived from the in-memory daily series. */
function recoveryRateDeltaFromTrend(): number {
  const series = demoRevenueTrend90d
  const last = series.length - 1
  if (last < 1) return demoMetrics.recoveryRateDelta
  const rateAt = (index: number) => {
    const point = series[index]
    if (!point || point.recoverable === 0) return 0
    return point.recovered / point.recoverable
  }
  const previous = last - 30
  return previous >= 0 ? rateAt(last) - rateAt(previous) : rateAt(last) - rateAt(0)
}

/**
 * Compute headline metrics from the in-memory store. Exported separately so
 * client components (Overview command center, Agent Command Center) can derive
 * the same values from the store they mutate during a session.
 */
export function computeLiveMetrics(): LiveDashboardMetrics {
  let recoveredAmount = 0
  let atRiskAmount = 0
  let recoverableAmount = 0

  for (const payment of demoPayments) {
    if (payment.status === 'recovered') {
      recoveredAmount += payment.amount
    } else if (OPEN_RISK_STATUSES.has(payment.status)) {
      atRiskAmount += payment.amount
      recoverableAmount += payment.amount * payment.recoveryProbability
    }
  }

  const totalConsidered = recoveredAmount + atRiskAmount

  return {
    revenueAtRisk: atRiskAmount,
    recoverableRevenue: Math.round(recoverableAmount),
    revenueRecovered: recoveredAmount,
    recoveryRate: totalConsidered > 0 ? recoveredAmount / totalConsidered : 0,
    recoveryRateDelta: recoveryRateDeltaFromTrend(),
    pendingApprovals: demoApprovals.filter((a) => a.status === 'pending').length,
    activeAgentActions: demoRecoveryActions.filter((a) => ACTIVE_ACTION_STATUSES.has(a.status)).length,
    paymentsAnalyzed: demoPayments.length,
    successfulRecoveries: demoPayments.filter((p) => p.status === 'recovered').length,
    aiActionsExecuted: demoRecoveryOutcomes.length,
  }
}

export async function getHeadlineMetrics() {
  return computeLiveMetrics()
}

export async function getSecondaryMetrics() {
  return demoSecondaryMetrics
}

export async function listInsights(): Promise<RecoveryInsight[]> {
  const seeded = [...demoInsights].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  // Live insights computed from current state come first; seeded insights are preserved.
  return [...generateLiveInsights(), ...seeded]
}

/** Daily revenue-flow trend, trimmed to the requested trailing window. */
export async function getRevenueTrend(days: 7 | 30 | 90 = 30): Promise<RevenueTrendPoint[]> {
  return demoRevenueTrend90d.slice(-days)
}

export async function getFailureBreakdown() {
  return demoFailureBreakdown
}

export async function getChannelPerformance() {
  return demoChannelPerformance
}

export async function getInterventionPerformance() {
  return demoInterventionPerformance
}

export async function getProbabilityDistribution() {
  return demoProbabilityDistribution
}

export async function getExpectedVsActual() {
  return demoExpectedVsActual
}

export async function getSegmentRisk() {
  return demoSegmentRisk
}

export async function getRecoveryForecast() {
  return demoRecoveryForecast
}

export async function getEarlyWarnings() {
  return demoEarlyWarnings
}

export async function getRootCauses() {
  return demoRootCauses
}

export async function getRecoveryFunnel() {
  return demoRecoveryFunnel
}

/** Recovery rate broken down by channel, for simple bar/summary charts. */
export async function getRecoveryRateByChannel() {
  const byChannel = new Map<string, { total: number; recovered: number }>()
  for (const payment of demoPayments) {
    const entry = byChannel.get(payment.channel) ?? { total: 0, recovered: 0 }
    entry.total += 1
    if (payment.status === 'recovered') entry.recovered += 1
    byChannel.set(payment.channel, entry)
  }
  return Array.from(byChannel.entries()).map(([channel, { total, recovered }]) => ({
    channel,
    total,
    recovered,
    rate: total === 0 ? 0 : recovered / total,
  }))
}
// ---------------------------------------------------------------------------
// LIVE ANALYTICS (Phase 3A.1)
// ---------------------------------------------------------------------------
// Everything the /analytics dashboard renders, derived from the current
// in-memory store (payments, recovery actions/outcomes, approvals). The page
// re-fetches via useRuntimeEvents whenever the agent, approvals, batch, or
// audit services notify a state change, so figures always reflect live state.
// ---------------------------------------------------------------------------

/** Channel performance extended with the raw counts behind the rates. */
export interface LiveChannelPerformance extends ChannelPerformance {
  total: number
  recovered: number
}

/** Live outcome performance for one recovery strategy. */
export interface LiveStrategyPerformance {
  strategyId: string
  name: string
  attempts: number
  recovered: number
  /** true when successRate is measured from recorded outcomes, false when it falls back to the catalog rate */
  measured: boolean
}

/** Headline + safety analytics derived from the current store. */
export interface LiveAnalyticsOverview {
  revenueAtRisk: number
  recoverableRevenue: number
  revenueRecovered: number
  recoveryRate: number
  successfulRecoveries: number
  failedRecoveries: number
  aiActionsExecuted: number
  humanEscalations: number
  safetyBlocks: number
  averageRecoveryTimeMinutes: number
  pendingApprovals: number
}

/** One-shot payload the /analytics dashboard renders and refreshes live. */
export interface LiveAnalyticsDashboard {
  overview: LiveAnalyticsOverview
  insights: RecoveryInsight[]
  byChannel: LiveChannelPerformance[]
  failureBreakdown: FailureReasonBreakdown[]
  strategyPerformance: LiveStrategyPerformance[]
  segmentRisk: SegmentRisk[]
  probabilityDistribution: ProbabilityBucket[]
  expectedVsActual: ExpectedVsActualPoint[]
}

const CHANNEL_LABELS: Record<RecoveryChannel, string> = {
  card: 'Cards',
  upi: 'UPI',
  netbanking: 'Net banking',
  wallet: 'Wallets',
  mandate: 'Mandates',
}

const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  consumer: 'Consumer',
  sme: 'SME',
  enterprise: 'Enterprise',
}

/** Recoverability defaults for failure reasons not present in the seeded breakdown. */
const DEFAULT_RECOVERABILITY: Partial<Record<FailureReason, 'high' | 'medium' | 'low'>> = {
  'bank-decline': 'high',
  timeout: 'high',
  'network-error': 'high',
  'mandate-expired': 'high',
  'insufficient-funds': 'medium',
  'issuer-decline': 'medium',
  'processor-error': 'medium',
  'card-expired': 'low',
  'card-lost': 'low',
  'fraud-suspected': 'low',
  'invalid-account': 'low',
}

/** The payment for an outcome, if it still exists in the store. */
function paymentForOutcome(outcome: { paymentId: string }) {
  return demoPayments.find((payment) => payment.id === outcome.paymentId)
}

/** Live per-channel performance computed from the current payment store. */
export function computeLiveChannelPerformance(): LiveChannelPerformance[] {
  const buckets = new Map<RecoveryChannel, { total: number; recovered: number; revenueRecovered: number }>()

  for (const payment of demoPayments) {
    const bucket = buckets.get(payment.channel) ?? { total: 0, recovered: 0, revenueRecovered: 0 }
    bucket.total += 1
    if (payment.status === 'recovered') {
      bucket.recovered += 1
      bucket.revenueRecovered += payment.amount
    }
    buckets.set(payment.channel, bucket)
  }

  return Array.from(buckets.entries())
    .map(([channel, bucket]) => ({
      channel,
      label: CHANNEL_LABELS[channel],
      total: bucket.total,
      recovered: bucket.recovered,
      failureRate: (bucket.total - bucket.recovered) / bucket.total,
      recoveryRate: bucket.recovered / bucket.total,
      revenueRecovered: bucket.revenueRecovered,
    }))
    .sort((a, b) => b.total - a.total)
}

/** Live failure-reason breakdown from current payments carrying a failure reason. */
export function computeLiveFailureBreakdown(): FailureReasonBreakdown[] {
  const buckets = new Map<FailureReason, { count: number; amount: number; recovered: number }>()

  for (const payment of demoPayments) {
    if (!payment.failureReason) continue
    const bucket = buckets.get(payment.failureReason) ?? { count: 0, amount: 0, recovered: 0 }
    bucket.count += 1
    bucket.amount += payment.amount
    if (payment.status === 'recovered') bucket.recovered += 1
    buckets.set(payment.failureReason, bucket)
  }

  const failedTotal = Array.from(buckets.values()).reduce((sum, bucket) => sum + bucket.count, 0)
  if (failedTotal === 0) return []

  return Array.from(buckets.entries())
    .map(([reason, bucket]) => {
      const seeded = demoFailureBreakdown.find((row) => row.reason === reason)
      return {
        reason,
        label: FAILURE_REASON_LABELS[reason],
        share: bucket.count / failedTotal,
        revenueImpact: bucket.amount,
        recoverability: seeded?.recoverability ?? DEFAULT_RECOVERABILITY[reason] ?? 'medium',
        recoveryRate: bucket.recovered / bucket.count,
      }
    })
    .sort((a, b) => b.share - a.share)
}
/** Live per-strategy outcome performance, measured from recorded recovery outcomes. */
export function computeLiveStrategyPerformance(): LiveStrategyPerformance[] {
  return demoStrategies.map((strategy) => {
    const triggerReasons = new Set<FailureReason>(strategy.triggerFailureReasons)
    const paymentIds = new Set(
      demoPayments
        .filter((payment) => payment.failureReason !== undefined && triggerReasons.has(payment.failureReason))
        .map((payment) => payment.id),
    )
    const relevant = demoRecoveryOutcomes.filter((outcome) => paymentIds.has(outcome.paymentId))
    return {
      strategyId: strategy.id,
      name: strategy.name,
      attempts: relevant.length,
      recovered: relevant.filter((outcome) => outcome.result === 'recovered').length,
      measured: relevant.length > 0,
    }
  })
}

/** Live revenue-at-risk by customer segment, from currently open payments. */
export function computeLiveSegmentRisk(): SegmentRisk[] {
  const segments = Object.keys(SEGMENT_LABELS) as CustomerSegment[]
  const buckets = new Map<CustomerSegment, { revenueAtRisk: number; paymentCount: number }>()
  for (const segment of segments) {
    buckets.set(segment, { revenueAtRisk: 0, paymentCount: 0 })
  }
  for (const payment of demoPayments) {
    if (!OPEN_RISK_STATUSES.has(payment.status)) continue
    const bucket = buckets.get(payment.segment)
    if (bucket) {
      bucket.revenueAtRisk += payment.amount
      bucket.paymentCount += 1
    }
  }
  return segments.map((segment) => {
    const bucket = buckets.get(segment) ?? { revenueAtRisk: 0, paymentCount: 0 }
    return {
      segment,
      label: SEGMENT_LABELS[segment],
      revenueAtRisk: bucket.revenueAtRisk,
      paymentCount: bucket.paymentCount,
    }
  })
}

/** Live histogram of recovery-probability estimates across current payments. */
export function computeLiveProbabilityDistribution(): ProbabilityBucket[] {
  const bucketCount = 10
  const counts = new Array<number>(bucketCount).fill(0)
  for (const payment of demoPayments) {
    const clamped = Math.min(0.999, Math.max(0, payment.recoveryProbability))
    const index = Math.floor(clamped * bucketCount)
    counts[index] = (counts[index] ?? 0) + 1
  }
  return counts.map((paymentCount, index) => ({
    bucketLabel: `${index * 10}\u2013${(index + 1) * 10}%`,
    paymentCount,
  }))
}
/**
 * Expected vs actual recovered revenue. The six seeded historical weeks are
 * preserved for context; a live "Now" point is appended from the current
 * store: expected sums recoveryProbability x amount for every payment with a
 * recorded outcome, actual sums the amounts actually recovered.
 */
export function computeLiveExpectedVsActual(): ExpectedVsActualPoint[] {
  let expected = 0
  let actual = 0
  for (const outcome of demoRecoveryOutcomes) {
    if (outcome.result === 'pending') continue
    const payment = paymentForOutcome(outcome)
    if (!payment) continue
    expected += payment.recoveryProbability * payment.amount
    if (outcome.result === 'recovered') {
      actual += outcome.amountRecovered ?? 0
    }
  }
  return [
    ...demoExpectedVsActual,
    { label: 'Now', expected: Math.round(expected), actual: Math.round(actual) },
  ]
}

/** Headline + safety analytics derived from the current in-memory store. */
export function computeLiveAnalyticsOverview(): LiveAnalyticsOverview {
  const metrics = computeLiveMetrics()
  const failedRecoveries = demoRecoveryOutcomes.filter((outcome) => outcome.result === 'failed').length
  const durations = demoRecoveryActions
    .filter((action) => action.completedAt !== undefined)
    .map(
      (action) =>
        (new Date(action.completedAt ?? action.scheduledAt).getTime() - new Date(action.scheduledAt).getTime()) / 60_000,
    )
    .filter((minutes) => Number.isFinite(minutes) && minutes >= 0)

  return {
    revenueAtRisk: metrics.revenueAtRisk,
    recoverableRevenue: metrics.recoverableRevenue,
    revenueRecovered: metrics.revenueRecovered,
    recoveryRate: metrics.recoveryRate,
    successfulRecoveries: metrics.successfulRecoveries,
    failedRecoveries,
    aiActionsExecuted: metrics.aiActionsExecuted,
    humanEscalations: demoApprovals.length,
    safetyBlocks: demoPayments.filter((payment) => payment.status === 'blocked').length,
    averageRecoveryTimeMinutes:
      durations.length > 0
        ? Math.round(durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length)
        : demoSecondaryMetrics.averageRecoveryTimeMinutes,
    pendingApprovals: metrics.pendingApprovals,
  }
}

/**
 * Insights computed from the current store. listInsights prepends these ahead
 * of the seeded narrative. Timestamps reuse the latest payment update so the
 * server render and client hydration stay identical.
 */
export function generateLiveInsights(): RecoveryInsight[] {
  const metrics = computeLiveMetrics()
  const asOf = demoPayments.reduce(
    (latest, payment) => (payment.updatedAt > latest ? payment.updatedAt : latest),
    demoPayments[0]?.updatedAt ?? '',
  )
  const insights: RecoveryInsight[] = []

  if (metrics.pendingApprovals > 0) {
    insights.push({
      id: 'live-pending-approvals',
      title: `${metrics.pendingApprovals} payment${metrics.pendingApprovals === 1 ? '' : 's'} awaiting human approval`,
      description:
        'The policy engine routed these recoveries to a human reviewer. Approve or reject on the Approvals page to unblock the queue.',
      impact: 'medium',
      category: 'risk',
      createdAt: asOf,
    })
  }

  const safetyBlocks = demoPayments.filter((payment) => payment.status === 'blocked').length
  if (safetyBlocks > 0) {
    insights.push({
      id: 'live-safety-blocks',
      title: `${safetyBlocks} payment${safetyBlocks === 1 ? '' : 's'} blocked by safety guardrails`,
      description:
        'Fraud, lost-instrument, or retry-limit policies stopped automated recovery for these payments. Manual review is required before any further action.',
      impact: 'high',
      category: 'anomaly',
      createdAt: asOf,
    })
  }

  insights.push({
    id: 'live-recovery-rate',
    title: `Recovery rate at ${formatPercent(metrics.recoveryRate, 1)} across tracked payments`,
    description: `${formatCurrency(metrics.revenueRecovered)} recovered so far \u2014 ${formatCurrency(metrics.revenueAtRisk)} is still open in the live dataset.`,
    impact: metrics.recoveryRate >= 0.5 ? 'low' : 'medium',
    category: 'trend',
    metricDelta: metrics.recoveryRateDelta,
    createdAt: asOf,
  })

  return insights
}

/** One-shot payload for the /analytics dashboard; re-fetched on every runtime event. */
export async function getAnalyticsDashboard(): Promise<LiveAnalyticsDashboard> {
  return {
    overview: computeLiveAnalyticsOverview(),
    insights: await listInsights(),
    byChannel: computeLiveChannelPerformance(),
    failureBreakdown: computeLiveFailureBreakdown(),
    strategyPerformance: computeLiveStrategyPerformance(),
    segmentRisk: computeLiveSegmentRisk(),
    probabilityDistribution: computeLiveProbabilityDistribution(),
    expectedVsActual: computeLiveExpectedVsActual(),
  }
}