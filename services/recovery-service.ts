/**
 * Recovery service — recovery actions, outcomes, and strategies. This is
 * the seam where a future LangGraph / recovery-orchestration engine would
 * plug in; today it reads and appends to the synthetic demo dataset.
 */
import type { RecoveryAction, RecoveryOutcome, RecoveryStrategy } from '@/types'
import { demoRecoveryActions, demoRecoveryOutcomes, demoStrategies } from '@/data/demo'
import { getPaymentProvider } from '@/lib/providers/payment-provider'

export async function listRecoveryActions(paymentId?: string): Promise<RecoveryAction[]> {
  const actions = paymentId
    ? demoRecoveryActions.filter((a) => a.paymentId === paymentId)
    : demoRecoveryActions
  return [...actions].sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
}

export async function listRecoveryOutcomes(paymentId?: string): Promise<RecoveryOutcome[]> {
  return paymentId
    ? demoRecoveryOutcomes.filter((o) => o.paymentId === paymentId)
    : demoRecoveryOutcomes
}

export async function recordRecoveryOutcome(outcome: RecoveryOutcome): Promise<RecoveryOutcome> {
  return getPaymentProvider().recordRecoveryOutcome(outcome)
}

export async function listStrategies(): Promise<RecoveryStrategy[]> {
  return [...demoStrategies].sort((a, b) => b.successRate - a.successRate)
}

export async function getStrategy(strategyId: string): Promise<RecoveryStrategy | undefined> {
  return demoStrategies.find((s) => s.id === strategyId)
}
