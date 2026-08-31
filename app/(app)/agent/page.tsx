import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Badge } from '@/components/ui/badge'
import { AgentCommandCenter } from '@/components/agent/agent-command-center'
import { listAgentEvents, listAgentDecisions, listPredictions, getAgentState } from '@/services/agent-service'
import { getHeadlineMetrics, getSecondaryMetrics } from '@/services/analytics-service'

export default async function AgentPage() {
  const [events, decisions, predictions, state, metrics, secondaryMetrics] = await Promise.all([
    listAgentEvents(10),
    listAgentDecisions(),
    listPredictions(),
    getAgentState(),
    getHeadlineMetrics(),
    getSecondaryMetrics(),
  ])

  return (
    <PageContainer className="max-w-[1400px]">
      <SectionHeader
        title="AI Recovery Agent"
        description="Autonomous revenue recovery with bounded decision-making."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" className="gap-1">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              Agent Online
            </Badge>
            <Badge variant="ai">Monitoring payment failures</Badge>
            <Badge variant="neutral">DEMO</Badge>
          </div>
        }
      />

      <AgentCommandCenter
        events={events}
        decisions={decisions}
        predictions={predictions}
        metrics={{
          aiActionsExecuted: secondaryMetrics.aiActionsExecuted,
          humanEscalations: secondaryMetrics.humanEscalations,
          safetyBlocks: secondaryMetrics.safetyBlocks,
          averageRecoveryTimeMinutes: secondaryMetrics.averageRecoveryTimeMinutes,
          revenueRecovered: metrics.revenueRecovered,
          recoveryRate: metrics.recoveryRate,
        }}
      />
    </PageContainer>
  )
}
