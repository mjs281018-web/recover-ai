import { AuditTrail } from '@/components/audit/audit-trail'
import { listAuditEvents } from '@/services/audit-service'

export default async function AuditPage() {
  const events = await listAuditEvents()
  return <AuditTrail initialEvents={events} />
}
