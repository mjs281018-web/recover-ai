/**
 * Audit service — the append-only trail of every agent, system, and human
 * action. Wraps the synthetic demo dataset for the foundation phase.
 */
import type { AuditEvent, AuditActor } from '@/types'
import { demoAuditEvents } from '@/data/demo'

export async function listAuditEvents(actor?: AuditActor): Promise<AuditEvent[]> {
  return actor ? demoAuditEvents.filter((e) => e.actor === actor) : demoAuditEvents
}
