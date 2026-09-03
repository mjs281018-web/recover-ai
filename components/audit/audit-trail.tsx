'use client'

import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/foundation/page-container'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listAuditEvents } from '@/services/audit-service'
import { useRuntimeEvents } from '@/lib/use-runtime-events'
import type { AuditEvent } from '@/types'

const ACTOR_LABEL: Record<string, string> = {
  'ai-agent': 'AI Agent',
  system: 'System',
  human: 'Human',
}

/**
 * Live audit trail. Re-reads the append-only in-memory audit log whenever a
 * runtime event fires, so retries, approvals, rejections and batch actions
 * appear here the moment they happen.
 */
export function AuditTrail({ initialEvents }: { initialEvents: AuditEvent[] }) {
  const event = useRuntimeEvents()
  const [events, setEvents] = useState<AuditEvent[]>(initialEvents)

  useEffect(() => {
    let active = true
    void listAuditEvents().then((next) => {
      if (active) setEvents(next)
    })
    return () => {
      active = false
    }
  }, [event])

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
          <CardDescription>Most recent actions first. This view updates live as the agent works.</CardDescription>
        </CardHeader>
        <PreviewTable columns={['Time', 'Actor', 'Action', 'Target']}>
          {events.map((event) => (
            <PreviewRow key={event.id}>
              <PreviewCell className="font-mono text-xs text-muted-foreground">{event.timestamp}</PreviewCell>
              <PreviewCell>
                <Badge
                  variant={
                    event.actor === 'ai-agent' ? 'ai' : event.actor === 'human' ? 'primary' : 'neutral'
                  }
                >
                  {ACTOR_LABEL[event.actor] ?? event.actor}
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