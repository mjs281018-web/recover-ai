/**
 * Approval service — the human-in-the-loop queue for actions the agent
 * cannot take autonomously under current policy. Wraps the synthetic demo
 * dataset; mutations are held in-memory for the foundation phase.
 */
import type { Approval, ApprovalStatus } from '@/types'
import { demoApprovals } from '@/data/demo'

export async function listApprovals(status?: ApprovalStatus): Promise<Approval[]> {
  const approvals = status ? demoApprovals.filter((a) => a.status === status) : demoApprovals
  return [...approvals].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1))
}

export async function decideApproval(
  approvalId: string,
  decision: 'approved' | 'rejected',
): Promise<Approval | undefined> {
  const approval = demoApprovals.find((a) => a.id === approvalId)
  if (!approval) return undefined
  approval.status = decision
  approval.decidedAt = new Date().toISOString()
  approval.decidedBy = 'human'
  return approval
}
