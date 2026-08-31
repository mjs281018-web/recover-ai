import { OverviewClient } from '@/components/overview/overview-client'
import { listAgentEvents } from '@/services/agent-service'
import { listPayments } from '@/services/payment-service'
import {
  getHeadlineMetrics,
  getSecondaryMetrics,
  getRecoveryFunnel,
  getRevenueTrend,
  getFailureBreakdown,
  getChannelPerformance,
  getInterventionPerformance,
  getProbabilityDistribution,
  getExpectedVsActual,
  getSegmentRisk,
  getRecoveryForecast,
  getEarlyWarnings,
  getRootCauses,
} from '@/services/analytics-service'

export default async function OverviewPage() {
  const [
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
  ] = await Promise.all([
    getHeadlineMetrics(),
    getSecondaryMetrics(),
    getRecoveryFunnel(),
    getRevenueTrend(90),
    getFailureBreakdown(),
    getChannelPerformance(),
    getInterventionPerformance(),
    getProbabilityDistribution(),
    getExpectedVsActual(),
    getSegmentRisk(),
    getRecoveryForecast(),
    getEarlyWarnings(),
    getRootCauses(),
    listAgentEvents(6),
    listPayments().then((p) => p.slice(0, 6)),
  ])

  return (
    <OverviewClient
      metrics={metrics}
      secondaryMetrics={secondaryMetrics}
      funnel={funnel}
      revenueTrend90d={revenueTrend90d}
      failureBreakdown={failureBreakdown}
      channelPerformance={channelPerformance}
      interventionPerformance={interventionPerformance}
      probabilityDistribution={probabilityDistribution}
      expectedVsActual={expectedVsActual}
      segmentRisk={segmentRisk}
      forecast={forecast}
      earlyWarnings={earlyWarnings}
      rootCauses={rootCauses}
      agentEvents={agentEvents}
      recentPayments={recentPayments}
    />
  )
}
