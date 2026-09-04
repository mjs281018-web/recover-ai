/**
 * Approval service — the human-in-the-loop queue for actions the agent
 * cannot take autonomously under current policy.
 */
import type { Approval, ApprovalStatus, Payment, PolicyEvaluation } from '@/types'
import { demoApprovals } from '@/data/demo'
import { notifyRuntimeChange } from '@/lib/runtime-events'

export async function listApprovals(status?: ApprovalStatus): Promise<Approval[]> {
  const approvals = status
    ? demoApprovals.filter((a) => a.status === status)
    : demoApprovals

  return [...approvals].sort((a, b) =>
    a.requestedAt < b.requestedAt ? 1 : -1,
  )
}

export async function getApprovalForPayment(
  paymentId: string,
): Promise<Approval | undefined> {
  return demoApprovals.find((approval) => approval.paymentId === paymentId)
}

export async function ensureApprovalForPayment(
  payment: Payment,
  policyEvaluation: PolicyEvaluation,
): Promise<Approval | undefined> {
  if (!policyEvaluation.requiresApproval) {
    return undefined
  }

  const existing = await getApprovalForPayment(payment.id)

  if (existing) {
    return existing
  }

  const approval: Approval = {
    id: `AP-session-${payment.id}`,
    paymentId: payment.id,
    amount: payment.amount,
    reason: policyEvaluation.reason,
    riskLevel: payment.risk,
    requestedBy: 'ai-agent',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  }

  demoApprovals.unshift(approval)
  notifyRuntimeChange('approval-requested', payment.id)

  return approval
}

export async function resetApprovalDecision(paymentId: string): Promise<void> {
  const approval = await getApprovalForPayment(paymentId)
  if (!approval) return

  approval.status = 'pending'
  delete approval.decidedAt
  delete approval.decidedBy

  notifyRuntimeChange('reset', paymentId)
}

export async function decideApproval(
  approvalId: string,
  decision: 'approved' | 'rejected',
): Promise<Approval | undefined> {
  const approval = demoApprovals.find((a) => a.id === approvalId)

  if (!approval || approval.status !== 'pending') {
    return approval
  }

  approval.status = decision
  approval.decidedAt = new Date().toISOString()
  approval.decidedBy = 'human'

  notifyRuntimeChange('approval-decided', approval.paymentId)

  return approval
}
