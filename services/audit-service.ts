/**
 * Audit service — the append-only trail of every agent, system, and human
 * action. Wraps the synthetic demo dataset for the foundation phase.
 * Session appends live only in memory and are removed on reset.
 */
import type { AuditEvent, AuditActor } from '@/types'
import { demoAuditEvents } from '@/data/demo'

const sessionAuditIds = new Set<string>()

export async function listAuditEvents(actor?: AuditActor): Promise<AuditEvent[]> {
  return actor ? demoAuditEvents.filter((e) => e.actor === actor) : demoAuditEvents
}

/** Append an audit event for the current demo session. Not persisted. */
export async function recordAuditEvent(event: AuditEvent): Promise<AuditEvent> {
  demoAuditEvents.push(event)
  sessionAuditIds.add(event.id)
  return event
}

/** Drop session-appended audit events for a payment (or all session events). */
export async function resetSessionAuditEvents(paymentId?: string): Promise<void> {
  for (let i = demoAuditEvents.length - 1; i >= 0; i--) {
    const event = demoAuditEvents[i]
    if (!sessionAuditIds.has(event.id)) continue
    if (paymentId && event.target !== paymentId) continue
    demoAuditEvents.splice(i, 1)
    sessionAuditIds.delete(event.id)
  }
}
