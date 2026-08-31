/**
 * Analytics service — headline metrics and generated insights for the
 * command center and analytics pages. Wraps synthetic demo data; a real
 * implementation would aggregate from the payments/recovery datastore.
 */
import type { RecoveryInsight, RevenueTrendPoint } from '@/types'
import {
  demoMetrics,
  demoSecondaryMetrics,
  demoInsights,
  demoPayments,
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

export async function getHeadlineMetrics() {
  return demoMetrics
}

export async function getSecondaryMetrics() {
  return demoSecondaryMetrics
}

export async function listInsights(): Promise<RecoveryInsight[]> {
  return [...demoInsights].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
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
