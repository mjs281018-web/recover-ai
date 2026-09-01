/**
 * Batch service — bulk recovery campaigns grouped by strategy. Wraps the
 * synthetic demo dataset for the foundation phase.
 */
import type { Batch } from '@/types'
import { demoBatches } from '@/data/demo'

export async function listBatches(): Promise<Batch[]> {
  return [...demoBatches].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}

export async function getBatch(batchId: string): Promise<Batch | undefined> {
  return demoBatches.find((b) => b.id === batchId)
}

export async function getBatchMetrics() {
  const totalCampaigns = demoBatches.length
  const totalPayments = demoBatches.reduce((sum, batch) => sum + batch.paymentCount, 0)
  const totalAmount = demoBatches.reduce((sum, batch) => sum + batch.totalAmount, 0)
  const recoveredAmount = demoBatches.reduce((sum, batch) => sum + batch.recoveredAmount, 0)

  const pendingAmount = totalAmount - recoveredAmount
  const recoveryRate = totalAmount === 0 ? 0 : (recoveredAmount / totalAmount) * 100

  const completed = demoBatches.filter((batch) => batch.status === 'completed').length
  const running = demoBatches.filter((batch) => batch.status === 'running').length
  const scheduled = demoBatches.filter((batch) => batch.status === 'scheduled').length
  const paused = demoBatches.filter((batch) => batch.status === 'paused').length

  return {
    totalCampaigns,
    totalPayments,
    totalAmount,
    recoveredAmount,
    pendingAmount,
    recoveryRate,
    completed,
    running,
    scheduled,
    paused,
  }
}
export interface BatchSimulationResult {
  batchId: string
  status: 'completed'
  paymentsProcessed: number
  recoveryAttempts: number
  recoveredPayments: number
  failedPayments: number
  escalatedPayments: number
  stoppedPayments: number
  totalAmount: number
  recoveredAmount: number
  pendingAmount: number
  recoveryRate: number
  steps: {
    name: string
    status: 'completed'
    processed: number
  }[]
}

export async function simulateBatchRecovery(
  batchId: string,
): Promise<BatchSimulationResult | undefined> {
  const batch = demoBatches.find((item) => item.id === batchId)

  if (!batch) {
    return undefined
  }

  const paymentsProcessed = batch.paymentCount
  const isHighValueReview = batch.strategyId === 'S-04'

  // Deterministic synthetic demo simulation.
  // S-04 represents a high-value campaign where risky payments
  // require human escalation before recovery can continue.
  const escalatedPayments = isHighValueReview
    ? Math.max(1, Math.round(paymentsProcessed * 0.18))
    : Math.round(paymentsProcessed * 0.04)

  const recoveryAttempts = Math.max(
    0,
    Math.round(paymentsProcessed * 0.88) - (isHighValueReview ? 1 : 0),
  )

  const recoveredPayments = isHighValueReview
    ? Math.max(0, Math.round(paymentsProcessed * 0.73))
    : Math.round(paymentsProcessed * 0.80)

  const failedPayments = Math.max(
    0,
    recoveryAttempts - recoveredPayments,
  )

  // Payments stopped by policy, retry limits, or rejected human approval.
  const stoppedPayments = Math.max(
    0,
    paymentsProcessed -
      recoveredPayments -
      failedPayments -
      escalatedPayments,
  )

  const recoveredAmount = Math.round(
    batch.totalAmount *
      Math.min(
        0.92,
        recoveredPayments / paymentsProcessed,
      ),
  )

  const pendingAmount = Math.max(
    0,
    batch.totalAmount - recoveredAmount,
  )

  const recoveryRate =
    batch.totalAmount === 0
      ? 0
      : (recoveredAmount / batch.totalAmount) * 100

  const stages: BatchSimulationResult['steps'] = [
    {
      name: 'Observe',
      status: 'completed',
      processed: paymentsProcessed,
    },
    {
      name: 'Analyze',
      status: 'completed',
      processed: paymentsProcessed,
    },
    {
      name: 'Predict',
      status: 'completed',
      processed: paymentsProcessed,
    },
    {
      name: 'Decide',
      status: 'completed',
      processed: recoveryAttempts,
    },
    {
      name: 'Policy Check',
      status: 'completed',
      processed: paymentsProcessed,
    },
    {
      name: 'Act',
      status: 'completed',
      processed: recoveryAttempts,
    },
    {
      name: 'Verify',
      status: 'completed',
      processed: recoveredPayments,
    },
    {
      name: 'Audit',
      status: 'completed',
      processed: paymentsProcessed,
    },
  ]

  return {
    batchId,
    status: 'completed',
    paymentsProcessed,
    recoveryAttempts,
    recoveredPayments,
    failedPayments,
    escalatedPayments,
    stoppedPayments,
    totalAmount: batch.totalAmount,
    recoveredAmount,
    pendingAmount,
    recoveryRate,
    steps: stages,
  }
}