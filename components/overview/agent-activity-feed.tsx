'use client'

import { useState } from 'react'
import { ChevronDown, Search, Brain, Zap, ShieldAlert, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentEvent } from '@/types'

const KIND_ICON: Record<AgentEvent['kind'], React.ComponentType<{ className?: string }>> = {
  analysis: Search,
  decision: Brain,
  action: Zap,
  escalation: ShieldAlert,
  learning: GraduationCap,
}

const KIND_COLOR: Record<AgentEvent['kind'], string> = {
  analysis: 'text-ai',
  decision: 'text-primary',
  action: 'text-success',
  escalation: 'text-warning',
  learning: 'text-ai',
}

function formatTimestampLabel(value: string): string {
  const match = value.match(/T(\d{2}:\d{2})/)
  return match ? `${match[1]} IST` : value
}

export function AgentActivityFeed({ events }: { events: AgentEvent[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(events[0]?.id ?? null)

  return (
    <div className="flex flex-col divide-y divide-border">
      {events.map((event) => {
        const Icon = KIND_ICON[event.kind]
        const isOpen = expandedId === event.id
        return (
          <button
            key={event.id}
            type="button"
            onClick={() => setExpandedId(isOpen ? null : event.id)}
            className="flex w-full flex-col gap-1.5 py-3 text-left first:pt-0 last:pb-0"
            aria-expanded={isOpen}
          >
            <div className="flex items-start gap-2.5">
              <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted', KIND_COLOR[event.kind])}>
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{event.title}</span>
                  <ChevronDown
                    className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')}
                  />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{event.description}</p>
              </div>
            </div>
            {isOpen && (
              <div className="ml-[34px] flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-muted-foreground">
                {event.paymentId && (
                  <span>
                    Payment <span className="font-mono text-foreground">{event.paymentId}</span>
                  </span>
                )}
                {event.confidence !== undefined && (
                  <span>
                    Confidence <span className="font-medium text-foreground">{Math.round(event.confidence * 100)}%</span>
                  </span>
                )}
                <span>{formatTimestampLabel(event.timestamp)}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
