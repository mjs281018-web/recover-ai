/**
 * Maps domain-specific status/severity unions onto the shared StatusKey
 * vocabulary the existing <StatusBadge /> component understands, so every
 * page can reuse one badge component instead of inventing new variants.
 */
import type { StatusKey } from '@/components/ui/status-badge'
import type {
  PaymentStatus,
  ApprovalStatus,
  PolicyStatus,
  RecoveryActionStatus,
  Batch,
  RecoveryStrategy,
} from '@/types'

export function paymentStatusKey(status: PaymentStatus): StatusKey {
  if (status === 'pending-approval') return 'human-approval'
  return status
}

export function approvalStatusKey(status: ApprovalStatus): { key: StatusKey; label: string } {
  switch (status) {
    case 'pending':
      return { key: 'pending', label: 'Pending' }
    case 'approved':
      return { key: 'success', label: 'Approved' }
    case 'rejected':
      return { key: 'failed', label: 'Rejected' }
    case 'expired':
      return { key: 'blocked', label: 'Expired' }
  }
}

export function policyStatusKey(status: PolicyStatus): { key: StatusKey; label: string } {
  switch (status) {
    case 'active':
      return { key: 'success', label: 'Active' }
    case 'draft':
      return { key: 'pending', label: 'Draft' }
    case 'disabled':
      return { key: 'blocked', label: 'Disabled' }
  }
}

export function recoveryActionStatusKey(status: RecoveryActionStatus): { key: StatusKey; label: string } {
  switch (status) {
    case 'queued':
      return { key: 'pending', label: 'Queued' }
    case 'in-progress':
      return { key: 'in-progress', label: 'In progress' }
    case 'completed':
      return { key: 'success', label: 'Completed' }
    case 'failed':
      return { key: 'failed', label: 'Failed' }
    case 'awaiting-approval':
      return { key: 'human-approval', label: 'Awaiting approval' }
    case 'cancelled':
      return { key: 'blocked', label: 'Cancelled' }
  }
}

export function batchStatusKey(status: Batch['status']): { key: StatusKey; label: string } {
  switch (status) {
    case 'scheduled':
      return { key: 'pending', label: 'Scheduled' }
    case 'running':
      return { key: 'in-progress', label: 'Running' }
    case 'completed':
      return { key: 'success', label: 'Completed' }
    case 'failed':
      return { key: 'failed', label: 'Failed' }
    case 'paused':
      return { key: 'blocked', label: 'Paused' }
  }
}

export function strategyStatusKey(status: RecoveryStrategy['status']): { key: StatusKey; label: string } {
  switch (status) {
    case 'active':
      return { key: 'success', label: 'Active' }
    case 'draft':
      return { key: 'pending', label: 'Draft' }
    case 'paused':
      return { key: 'blocked', label: 'Paused' }
  }
}
