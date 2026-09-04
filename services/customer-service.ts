/**
 * Customer service — account and mandate context for the recovery engine
 * and UI. Wraps the synthetic demo dataset for the foundation phase.
 */
import type {
  Customer,
  Payment,
  RecoveryAction,
  RecoveryOutcome,
  Approval,
  AuditEvent,
} from '@/types'
import {
  demoCustomers,
  demoPayments,
  demoRecoveryActions,
  demoRecoveryOutcomes,
  demoApprovals,
  demoAuditEvents,
  demoStrategies,
} from '@/data/demo'
import { getPaymentProvider } from '@/lib/providers/payment-provider'
import { FAILURE_REASON_LABELS, RECOVERY_ACTION_LABELS } from '@/types'

export async function listCustomers(): Promise<Customer[]> {
  return [...demoCustomers].sort((a, b) => b.lifetimeValue - a.lifetimeValue)
}

export async function getCustomer(customerId: string): Promise<Customer | undefined> {
  return demoCustomers.find((c) => c.id === customerId)
}

/** Full payment history for a customer, via the active payment provider. */
export async function getCustomerPaymentHistory(customerId: string) {
  return getPaymentProvider().getCustomerHistory(customerId)
}

/** Payments belonging to a customer, from the shared demo store. */
export async function getCustomerPayments(customerId: string): Promise<Payment[]> {
  return [...demoPayments]
    .filter((p) => p.customerId === customerId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

/** Recovery actions for a customer's payments, from the shared demo store. */
export async function getCustomerRecoveryActions(customerId: string): Promise<RecoveryAction[]> {
  const customerPaymentIds = new Set(
    demoPayments.filter((p) => p.customerId === customerId).map((p) => p.id),
  )
  return [...demoRecoveryActions]
    .filter((action) => customerPaymentIds.has(action.paymentId))
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
}

/** Recovery outcomes for a customer's payments, from the shared demo store. */
export async function getCustomerRecoveryOutcomes(customerId: string): Promise<RecoveryOutcome[]> {
  const customerPaymentIds = new Set(
    demoPayments.filter((p) => p.customerId === customerId).map((p) => p.id),
  )
  return [...demoRecoveryOutcomes]
    .filter((outcome) => customerPaymentIds.has(outcome.paymentId))
    .sort((a, b) => {
      const aTime = a.recoveredAt ?? ''
      const bTime = b.recoveredAt ?? ''
      return aTime < bTime ? 1 : -1
    })
}

/** Approvals linked to a customer's payments. */
export async function getCustomerApprovals(customerId: string): Promise<Approval[]> {
  const customerPaymentIds = new Set(
    demoPayments.filter((p) => p.customerId === customerId).map((p) => p.id),
  )
  return [...demoApprovals]
    .filter((approval) => customerPaymentIds.has(approval.paymentId))
    .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1))
}

/** Audit events referencing a customer's payments. */
export async function getCustomerAuditEvents(customerId: string): Promise<AuditEvent[]> {
  const customerPaymentIds = new Set(
    demoPayments.filter((p) => p.customerId === customerId).map((p) => p.id),
  )
  const customerName = demoCustomers.find((c) => c.id === customerId)?.name ?? customerId
  return [...demoAuditEvents]
    .filter(
      (event) =>
        Array.from(customerPaymentIds).some((pid) => event.target.includes(pid)) || event.actor === customerName,
    )
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}

/** Computed customer-level recovery summary from the shared demo store. */
export interface CustomerRecoverySummary {
  customerId: string
  customerName: string
  totalPayments: number
  totalAmount: number
  /** Sum of open/risky payments (at-risk, in-progress, pending-approval, failed) */
  totalAmountAtRisk: number
  totalRecoveredAmount: number
  successfulRecoveries: number
  failedRecoveries: number
  pendingApprovals: number
  blockedPayments: number
  recoveryRate: number
  failureReasons: { reason: string; label: string; count: number; amount: number }[]
  strategiesUsed: { strategyId: string; name: string; attempts: number; successes: number; successRate: number }[]
  channelsUsed: { channel: string; label: string; attempts: number; successes: number; successRate: number }[]
  recentOutcomes: {
    paymentId: string
    action: string
    result: string
    amountRecovered: number | null
    channel: string
    recoveredAt: string | null
  }[]
}

export async function getCustomerRecoverySummary(
  customerId: string,
): Promise<CustomerRecoverySummary | undefined> {
  const customer = demoCustomers.find((c) => c.id === customerId)
  if (!customer) return undefined

  const payments = demoPayments.filter((p) => p.customerId === customerId)
  const paymentIds = new Set(payments.map((p) => p.id))
  const customerOutcomes = demoRecoveryOutcomes.filter((o) => paymentIds.has(o.paymentId))
  const customerActions = demoRecoveryActions.filter((a) => paymentIds.has(a.paymentId))
  const customerApprovals = demoApprovals.filter((a) => paymentIds.has(a.paymentId))
  void customerActions // available for future timeline enrichment
  void customerApprovals

  const recovered = customerOutcomes.filter((o) => o.result === 'recovered')
  const failed = customerOutcomes.filter((o) => o.result === 'failed')
  const totalRecovered = recovered.reduce((sum, o) => sum + (o.amountRecovered ?? 0), 0)

  const atRiskStatuses: string[] = ['at-risk', 'in-progress', 'pending-approval', 'failed']
  const totalAmountAtRisk = payments
    .filter((p) => atRiskStatuses.includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0)

  // Failure reasons
  const reasonMap = new Map<string, { count: number; amount: number }>()
  for (const payment of payments) {
    if (!payment.failureReason) continue
    const key = payment.failureReason
    const existing = reasonMap.get(key) ?? { count: 0, amount: 0 }
    existing.count += 1
    existing.amount += payment.amount
    reasonMap.set(key, existing)
  }
  const failureReasons = [...reasonMap.entries()].map(([reason, data]) => ({
    reason,
    label: FAILURE_REASON_LABELS[reason as keyof typeof FAILURE_REASON_LABELS] ?? reason,
    count: data.count,
    amount: data.amount,
  }))

  // Strategies used (match outcomes to strategies by the payment's failure reason)
  const strategyMap = new Map<string, { attempts: number; successes: number }>()
  for (const outcome of customerOutcomes) {
    const payment = payments.find((p) => p.id === outcome.paymentId)
    if (!payment || !payment.failureReason) continue
    const strategy = demoStrategies.find((s) =>
      s.triggerFailureReasons.includes(payment.failureReason!),
    )
    const strategyId = strategy ? strategy.id : 'direct-retry'
    const existing = strategyMap.get(strategyId) ?? { attempts: 0, successes: 0 }
    existing.attempts += 1
    if (outcome.result === 'recovered') existing.successes += 1
    strategyMap.set(strategyId, existing)
  }
  const strategiesUsed = [...strategyMap.entries()].map(([strategyId, data]) => {
    const strat = demoStrategies.find((s) => s.id === strategyId) ?? {
      id: 'direct-retry',
      name: 'Direct retry',
    }
    return {
      strategyId,
      name: strat.name,
      attempts: data.attempts,
      successes: data.successes,
      successRate: data.attempts > 0 ? data.successes / data.attempts : 0,
    }
  })

  // Channels used
  const channelMap = new Map<string, { attempts: number; successes: number }>()
  for (const outcome of customerOutcomes) {
    const existing = channelMap.get(outcome.channel) ?? { attempts: 0, successes: 0 }
    existing.attempts += 1
    if (outcome.result === 'recovered') existing.successes += 1
    channelMap.set(outcome.channel, existing)
  }
  const channelLabels: Record<string, string> = {
    upi: 'UPI',
    card: 'Cards',
    netbanking: 'Net banking',
    wallet: 'Wallet',
    mandate: 'Mandate',
  }
  const channelsUsed = [...channelMap.entries()].map(([channel, data]) => ({
    channel,
    label: channelLabels[channel] ?? channel,
    attempts: data.attempts,
    successes: data.successes,
    successRate: data.attempts > 0 ? data.successes / data.attempts : 0,
  }))

  // Recent outcomes
  const recentOutcomes = [...customerOutcomes]
    .sort((a, b) => {
      const aTime = a.recoveredAt ?? ''
      const bTime = b.recoveredAt ?? ''
      return aTime < bTime ? 1 : -1
    })
    .slice(0, 6)
    .map((outcome) => ({
      paymentId: outcome.paymentId,
      action:
        RECOVERY_ACTION_LABELS[outcome.action as keyof typeof RECOVERY_ACTION_LABELS] ??
        outcome.action,
      result: outcome.result,
      amountRecovered: outcome.amountRecovered ?? null,
      channel: outcome.channel,
      recoveredAt: outcome.recoveredAt ?? null,
    }))

  return {
    customerId,
    customerName: customer.name,
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    totalAmountAtRisk,
    totalRecoveredAmount: totalRecovered,
    successfulRecoveries: recovered.length,
    failedRecoveries: failed.length,
    pendingApprovals: customerApprovals.filter((a) => a.status === 'pending').length,
    blockedPayments: payments.filter((p) => p.status === 'blocked').length,
    recoveryRate: customerOutcomes.length > 0 ? recovered.length / customerOutcomes.length : 0,
    failureReasons,
    strategiesUsed,
    channelsUsed,
    recentOutcomes,
  }
}
