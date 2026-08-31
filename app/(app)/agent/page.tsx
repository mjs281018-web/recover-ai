import { Sparkles, Brain, Zap, ArrowUpRight, GraduationCap } from 'lucide-react'
import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPercent } from '@/lib/format'
import { listAgentEvents, listAgentDecisions, getAgentState } from '@/services/agent-service'
import { RECOVERY_ACTION_LABELS, type AgentEventKind } from '@/types'

const KIND_ICON: Record<AgentEventKind, React.ComponentType<{ className?: string }>> = {
  analysis: Brain,
  decision: Zap,
  action: ArrowUpRight,
  escalation: Sparkles,
  learning: GraduationCap,
}

export default async function AgentPage() {
  const [events, decisions, state] = await Promise.all([
    listAgentEvents(10),
    listAgentDecisions(),
    getAgentState(),
  ])

  return (
    <PageContainer>
      <SectionHeader
        title="AI Agent"
        description="The autonomous recovery agent's live event stream and the reasoning behind its recent decisions."
        actions={<Badge variant="ai">Agent state — {state.replace('-', ' ')}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event stream</CardTitle>
            <CardDescription>Analysis, decisions, actions, escalations, and learning updates.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {events.map((event) => {
              const Icon = KIND_ICON[event.kind]
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-ai-muted text-ai">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                  {event.confidence !== undefined && (
                    <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                      {formatPercent(event.confidence)}
                    </span>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent decisions</CardTitle>
            <CardDescription>Why the agent chose each recommended action.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-0">
            {decisions.map((decision) => (
              <div key={decision.id} className="space-y-2 rounded-lg border border-border bg-surface/40 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{decision.paymentId}</span>
                  <Badge variant={decision.requiresApproval ? 'warning' : 'ai'}>
                    {RECOVERY_ACTION_LABELS[decision.recommendedAction]}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{decision.summary}</p>
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                  {decision.reasoning.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
