import { PageContainer } from '@/components/foundation/page-container'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listAuditEvents } from '@/services/audit-service'

const ACTOR_LABEL: Record<string, string> = {
  'ai-agent': 'AI Agent',
  system: 'System',
  human: 'Human',
}

export default async function AuditPage() {
  const events = await listAuditEvents()

  return (
    <PageContainer>
      <SectionHeader
        title="Audit Trail"
        description="Every action the agent, the system, and human reviewers have taken — kept for compliance and review."
        actions={<Badge variant="neutral">{events.length} events</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>Most recent actions first.</CardDescription>
        </CardHeader>
        <PreviewTable columns={['Time', 'Actor', 'Action', 'Target']}>
          {events.map((event) => (
            <PreviewRow key={event.id}>
              <PreviewCell className="font-mono text-xs text-muted-foreground">{event.timestamp}</PreviewCell>
              <PreviewCell>
                <Badge variant={event.actor === 'ai-agent' ? 'ai' : event.actor === 'human' ? 'primary' : 'neutral'}>
                  {ACTOR_LABEL[event.actor]}
                </Badge>
              </PreviewCell>
              <PreviewCell>{event.action}</PreviewCell>
              <PreviewCell className="font-mono text-xs text-muted-foreground">{event.target}</PreviewCell>
            </PreviewRow>
          ))}
        </PreviewTable>
      </Card>
    </PageContainer>
  )
}
