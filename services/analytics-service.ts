/**
 * Analytics service — headline metrics and generated insights for the
 * command center and analytics pages. Wraps synthetic demo data; a real
 * implementation would aggregate from the payments/recovery datastore.
 */
import type {
  AgentEvent,
  AgentEventKind,
  ChannelPerformance,
  CustomerSegment,
  ExpectedVsActualPoint,
  FailureReason,
  FailureReasonBreakdown,
  Payment,
  PaymentStatus,
  Prediction,
  ProbabilityBucket,
  RecoveryAction,
  RecoveryActionType,
  RecoveryActionStatus,
  RecoveryChannel,
  RecoveryInsight,
  RecoveryOutcome,
  RecoveryStrategy,
  RevenueTrendPoint,
  SegmentRisk,
} from '@/types'
import { FAILURE_REASON_LABELS, RECOVERY_ACTION_LABELS } from '@/types'
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
  demoAgentEvents,
  demoPredictions,
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

// ---------------------------------------------------------------------------
// Live outcome learning
// ---------------------------------------------------------------------------
// Derives strategy/channel/failure-reason performance and adaptive learning
// signals from the actual in-memory recovery outcomes + actions. Truthful:
// measured rates come only from recorded outcomes; catalog defaults are used
// only when no evidence exists and are clearly flagged as unmeasured.

export interface LiveStrategyLearning {
  strategyId: string
  name: string
  status: 'active' | 'draft' | 'paused'
  attempts: number
  successes: number
  failures: number
  successRate: number
  recoveredRevenue: number
  averageRecoveryValue: number
  preferredChannel: string | null
  /** true if successRate is computed from measured outcomes, false if catalog default */
  measured: boolean
}

export interface LiveChannelLearning {
  channel: RecoveryChannel
  label: string
  attempts: number
  successes: number
  failures: number
  successRate: number
  recoveredRevenue: number
}

export interface LiveFailureReasonLearning {
  reason: FailureReason | 'other'
  label: string
  attempts: number
  successes: number
  failures: number
  successRate: number
  recoveredRevenue: number
}

export interface LiveRecentOutcome {
  id: string
  paymentId: string
  action: RecoveryActionType
  result: 'recovered' | 'failed' | 'pending'
  amountRecovered: number | null
  channel: RecoveryChannel
  recoveredAt: string | null
  customerName: string
  paymentAmount: number
}

export type LearningSignalImpact = 'positive' | 'negative' | 'neutral'

export interface LearningSignal {
  id: string
  message: string
  impact: LearningSignalImpact
  timestamp: string
}

export interface OutcomeLearningDashboard {
  summary: {
    totalAttempts: number
    successes: number
    failures: number
    pending: number
    overallSuccessRate: number
    totalRecoveredRevenue: number
    averageRecoveryValue: number
  }
  strategyLearning: LiveStrategyLearning[]
  channelLearning: LiveChannelLearning[]
  failureReasonLearning: LiveFailureReasonLearning[]
  recentOutcomes: LiveRecentOutcome[]
  signals: LearningSignal[]
  predictions: Prediction[]
  modelUpdates: AgentEvent[]
}

/** Payments whose failure reason matches a strategy's trigger reasons. */
function paymentsForStrategy(strategy: RecoveryStrategy): Payment[] {
  return demoPayments.filter(
    (p) => p.failureReason && strategy.triggerFailureReasons.includes(p.failureReason),
  )
}

/** Outcomes for a given set of payment IDs. */
function outcomesForPayments(paymentIds: Set<string>): RecoveryOutcome[] {
  return demoRecoveryOutcomes.filter((o) => paymentIds.has(o.paymentId))
}

export function computeLiveStrategyLearning(): LiveStrategyLearning[] {
  return demoStrategies.map((strategy) => {
    const matchedPayments = paymentsForStrategy(strategy)
    const matchedIds = new Set(matchedPayments.map((p) => p.id))
    const outcomes = outcomesForPayments(matchedIds)

    const attempts = outcomes.length
    const successes = outcomes.filter((o) => o.result === 'recovered').length
    const failures = outcomes.filter((o) => o.result === 'failed').length
    const recoveredRevenue = outcomes
      .filter((o) => o.result === 'recovered')
      .reduce((sum, o) => sum + (o.amountRecovered ?? 0), 0)

    // Preferred channel = most frequent channel among successful outcomes.
    const channelCounts = new Map<RecoveryChannel, number>()
    for (const o of outcomes) {
      if (o.result === 'recovered') {
        channelCounts.set(o.channel, (channelCounts.get(o.channel) ?? 0) + 1)
      }
    }
    let preferredChannel: string | null = null
    let maxCount = 0
    for (const [channel, count] of channelCounts) {
      if (count > maxCount) {
        maxCount = count
        preferredChannel = CHANNEL_LABELS[channel] ?? channel
      }
    }

    // Measured only when we have at least one recorded outcome.
    const measured = attempts > 0
    const successRate = measured ? successes / attempts : strategy.successRate
    const averageRecoveryValue = successes > 0 ? recoveredRevenue / successes : 0

    return {
      strategyId: strategy.id,
      name: strategy.name,
      status: strategy.status,
      attempts,
      successes,
      failures,
      successRate,
      recoveredRevenue,
      averageRecoveryValue,
      preferredChannel,
      measured,
    }
  })
}

export function computeLiveChannelLearning(): LiveChannelLearning[] {
  const channels: RecoveryChannel[] = ['upi', 'card', 'netbanking', 'wallet', 'mandate']
  return channels.map((channel) => {
    const outcomes = demoRecoveryOutcomes.filter((o) => o.channel === channel)
    const attempts = outcomes.length
    const successes = outcomes.filter((o) => o.result === 'recovered').length
    const failures = outcomes.filter((o) => o.result === 'failed').length
    const recoveredRevenue = outcomes
      .filter((o) => o.result === 'recovered')
      .reduce((sum, o) => sum + (o.amountRecovered ?? 0), 0)
    const successRate = attempts > 0 ? successes / attempts : 0

    return {
      channel,
      label: CHANNEL_LABELS[channel],
      attempts,
      successes,
      failures,
      successRate,
      recoveredRevenue,
    }
  })
}

export function computeLiveFailureReasonLearning(): LiveFailureReasonLearning[] {
  const reasonMap = new Map<FailureReason | 'other', RecoveryOutcome[]>()
  for (const outcome of demoRecoveryOutcomes) {
    const payment = demoPayments.find((p) => p.id === outcome.paymentId)
    const reason = payment?.failureReason ?? 'other'
    const list = reasonMap.get(reason) ?? []
    list.push(outcome)
    reasonMap.set(reason, list)
  }

  const result: LiveFailureReasonLearning[] = []
  for (const [reason, outcomes] of reasonMap) {
    const attempts = outcomes.length
    const successes = outcomes.filter((o) => o.result === 'recovered').length
    const failures = outcomes.filter((o) => o.result === 'failed').length
    const recoveredRevenue = outcomes
      .filter((o) => o.result === 'recovered')
      .reduce((sum, o) => sum + (o.amountRecovered ?? 0), 0)
    const successRate = attempts > 0 ? successes / attempts : 0

    result.push({
      reason,
      label: FAILURE_REASON_LABELS[reason as FailureReason] ?? reason,
      attempts,
      successes,
      failures,
      successRate,
      recoveredRevenue,
    })
  }

  return result.sort((a, b) => b.attempts - a.attempts)
}

export function computeLiveRecentOutcomes(): LiveRecentOutcome[] {
  return [...demoRecoveryOutcomes]
    .sort((a, b) => {
      const aTime = a.recoveredAt ?? ''
      const bTime = b.recoveredAt ?? ''
      return aTime < bTime ? 1 : -1
    })
    .slice(0, 8)
    .map((outcome) => {
      const payment = demoPayments.find((p) => p.id === outcome.paymentId)
      return {
        id: outcome.id,
        paymentId: outcome.paymentId,
        action: outcome.action,
        result: outcome.result,
        amountRecovered: outcome.amountRecovered ?? null,
        channel: outcome.channel,
        recoveredAt: outcome.recoveredAt ?? null,
        customerName: payment?.customerName ?? 'Unknown',
        paymentAmount: payment?.amount ?? 0,
      }
    })
}

export function computeLiveLearningSignals(): LearningSignal[] {
  const signals: LearningSignal[] = []
  const strategyLearning = computeLiveStrategyLearning()
  const channelLearning = computeLiveChannelLearning()

  // Find the strategy with the actual highest measured success rate.
  const measuredStrategies = strategyLearning.filter((s) => s.measured && s.attempts > 0)
  if (measuredStrategies.length > 0) {
    const maxSuccessRate = Math.max(...measuredStrategies.map((s) => s.successRate))

    // Only claim "highest measured success rate" if at least one recovery succeeded (rate > 0)
    if (maxSuccessRate > 0) {
      const topCandidates = measuredStrategies.filter((s) => s.successRate === maxSuccessRate)
      const best = topCandidates.reduce((a, b) => {
        if (a.attempts !== b.attempts) {
          return a.attempts > b.attempts ? a : b
        }
        return a.recoveredRevenue >= b.recoveredRevenue ? a : b
      })

      signals.push({
        id: 'ls-01',
        message: `"${best.name}" has the highest measured success rate at ${formatPercent(best.successRate)} across ${best.attempts} outcome${best.attempts === 1 ? '' : 's'}.`,
        impact: best.successRate >= 0.6 ? 'positive' : 'negative',
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Channel signals.
  const measuredChannels = channelLearning.filter((c) => c.attempts >= 1)
  if (measuredChannels.length > 0) {
    const best = measuredChannels.reduce((a, b) => (a.successRate >= b.successRate ? a : b))
    signals.push({
      id: 'ls-02',
      message: `${best.label} leads recovery performance at ${formatPercent(best.successRate)} across ${best.attempts} outcome${best.attempts === 1 ? '' : 's'}.`,
      impact: best.successRate >= 0.6 ? 'positive' : 'negative',
      timestamp: new Date().toISOString(),
    })
  }

  // Overall outcome summary.
  const totalOutcomes = demoRecoveryOutcomes.length
  const totalRecovered = demoRecoveryOutcomes.filter((o) => o.result === 'recovered').length
  if (totalOutcomes > 0) {
    const rate = totalRecovered / totalOutcomes
    signals.push({
      id: 'ls-03',
      message: `${totalRecovered} of ${totalOutcomes} recorded outcomes recovered (${formatPercent(rate)}).`,
      impact: rate >= 0.5 ? 'positive' : 'negative',
      timestamp: new Date().toISOString(),
    })
  }

  return signals
}

/** One-shot payload for the /learning dashboard; re-fetched on every runtime event. */
export async function getOutcomeLearningDashboard(): Promise<OutcomeLearningDashboard> {
  const outcomes = demoRecoveryOutcomes
  const successes = outcomes.filter((o) => o.result === 'recovered').length
  const failures = outcomes.filter((o) => o.result === 'failed').length
  const pending = outcomes.filter((o) => o.result === 'pending').length
  const totalAttempts = outcomes.length
  const totalRecoveredRevenue = outcomes
    .filter((o) => o.result === 'recovered')
    .reduce((sum, o) => sum + (o.amountRecovered ?? 0), 0)

  const predictions = [...demoPredictions].sort((a, b) =>
    a.generatedAt < b.generatedAt ? 1 : -1,
  )
  const modelUpdates = demoAgentEvents
    .filter((e) => e.kind === 'learning')
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  return {
    summary: {
      totalAttempts,
      successes,
      failures,
      pending,
      overallSuccessRate: totalAttempts > 0 ? successes / totalAttempts : 0,
      totalRecoveredRevenue,
      averageRecoveryValue: successes > 0 ? totalRecoveredRevenue / successes : 0,
    },
    strategyLearning: computeLiveStrategyLearning(),
    channelLearning: computeLiveChannelLearning(),
    failureReasonLearning: computeLiveFailureReasonLearning(),
    recentOutcomes: computeLiveRecentOutcomes(),
    signals: computeLiveLearningSignals(),
    predictions,
    modelUpdates,
  }
}