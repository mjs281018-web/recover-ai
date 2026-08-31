import { GraduationCap } from 'lucide-react'
import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { formatPercent } from '@/lib/format'
import { listPredictions, listAgentEvents } from '@/services/agent-service'

export default async function LearningPage() {
  const [predictions, events] = await Promise.all([
    listPredictions(),
    listAgentEvents().then((all) => all.filter((e) => e.kind === 'learning')),
  ])

  return (
    <PageContainer>
      <SectionHeader
        title="Outcome Learning"
        description="How the recovery-probability model updates itself from real outcomes over time."
        actions={<Badge variant="ai">Model recovery-gbm-v4.2</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent predictions</CardTitle>
            <CardDescription>What the model estimated and which signals drove it.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {predictions.map((prediction) => (
              <div key={prediction.id} className="space-y-2 rounded-lg border border-border bg-surface/40 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{prediction.paymentId}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    confidence {formatPercent(prediction.confidence)}
                  </span>
                </div>
                <ProbabilityBar value={prediction.recoveryProbability} />
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                  {prediction.factors.map((factor, i) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <GraduationCap className="size-4 text-ai" />
              Model updates
            </CardTitle>
            <CardDescription>Retraining and calibration events from the agent's event stream.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {events.map((event) => (
              <div key={event.id} className="flex flex-col gap-0.5 border-l-2 border-ai/30 pl-3">
                <span className="text-sm font-medium text-foreground">{event.title}</span>
                <span className="text-xs text-muted-foreground">{event.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
