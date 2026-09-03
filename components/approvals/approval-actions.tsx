'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { approvalStatusKey } from '@/lib/status'
import { decideApproval, listApprovals } from '@/services/approval-service'
import { recordAuditEvent } from '@/services/audit-service'
import { useRuntimeEvents } from '@/lib/use-runtime-events'
import type { Approval } from '@/types'

function timeLabel(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })
}

/**
 * Live approve/reject control for a single approval in the queue.
 * Decides through the real approval service, writes an audit event, and lets
 * runtime subscribers (Agent Command Center, At-Risk, Overview) react.
 */
export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const event = useRuntimeEvents()
  const [approval, setApproval] = useState<Approval | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    void listApprovals().then((all) => {
      const found = all.find((a) => a.id === approvalId)
      if (active) setApproval(found ?? null)
    })
    return () => {
      active = false
    }
  }, [approvalId, event])

  if (!approval) {
    return <StatusBadge status="pending" label="Pending" />
  }

  const status = approvalStatusKey(approval.status)

  async function handleDecision(decision: 'approved' | 'rejected') {
    if (busy || approval === null || approval.status !== 'pending') return
    setBusy(true)
    try {
      await decideApproval(approval.id, decision)
      await recordAuditEvent({
        id: `A-approval-${approval.id}-${Date.now()}`,
        actor: 'human',
        action:
          decision === 'approved'
            ? 'Approved recovery approval'
            : 'Rejected recovery approval',
        target: approval.paymentId,
        timestamp: timeLabel(),
        status: decision === 'approved' ? 'info' : 'failed',
      })
      const all = await listApprovals()
      setApproval(all.find((a) => a.id === approvalId) ?? null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={status.key} label={status.label} />
      {approval.status === 'pending' && (
        <>
          <Button
            size="sm"
            onClick={() => void handleDecision('approved')}
            disabled={busy}
            className="gap-1"
          >
            <Check className="size-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleDecision('rejected')}
            disabled={busy}
            className="gap-1 text-destructive"
          >
            <X className="size-3.5" />
            Reject
          </Button>
        </>
      )}
    </div>
  )
}

/** Live count of pending approvals for page headers. */
export function ApprovalPendingCount() {
  const event = useRuntimeEvents()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    void listApprovals('pending').then((all) => {
      if (active) setCount(all.length)
    })
    return () => {
      active = false
    }
  }, [event])

  return <Badge variant="warning">{count} pending</Badge>
}