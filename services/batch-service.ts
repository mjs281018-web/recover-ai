
/**
 * Batch service — bulk recovery campaigns grouped by strategy.
 * Wraps the synthetic demo dataset for the foundation phase.
 */

import type { Batch } from '@/types'
import {
  demoBatches,
  demoPayments,
  demoStrategies,
} from '@/data/demo'
import { DEMO_SIMULATION_PAYMENT_IDS } from '@/lib/recovery-pipeline'
import { notifyRuntimeChange } from '@/lib/runtime-events'
import { recordAuditEvent } from '@/services/audit-service'

/**
 * Shared batch metric type.
 *
 * Keep this type exported so API routes, UI components,
 * and other services can use the same contract.
 */
export interface BatchMetrics {
  totalCampaigns: number
  totalPayments: number
  totalAmount: number
  recoveredAmount: number
  pendingAmount: number
  recoveryRate: number
  completed: number
  running: number
  scheduled: number
  paused: number
}

/**
 * Result returned after a batch recovery simulation.
 */
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

/**
 * Returns a stable timestamp for demo audit/runtime events.
 */
function sessionTimestamp(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })
}

/**
 * List all recovery batches.
 */
export async function listBatches(): Promise<Batch[]> {
  return [...demoBatches].sort((a, b) =>
    a.startedAt < b.startedAt ? 1 : -1,
  )
}

/**
 * Get a single batch by ID.
 */
export async function getBatch(
  batchId: string,
): Promise<Batch | undefined> {
  return demoBatches.find(
    (batch) => batch.id === batchId,
  )
}

/**
 * Calculate aggregate metrics across all campaigns.
 *
 * Explicit BatchMetrics return type ensures that all consumers
 * share the same metric contract.
 */
export async function getBatchMetrics(): Promise<BatchMetrics> {
  const totalCampaigns = demoBatches.length

  const totalPayments = demoBatches.reduce(
    (sum, batch) => sum + batch.paymentCount,
    0,
  )

  const totalAmount = demoBatches.reduce(
    (sum, batch) => sum + batch.totalAmount,
    0,
  )

  const recoveredAmount = demoBatches.reduce(
    (sum, batch) => sum + batch.recoveredAmount,
    0,
  )

  const pendingAmount = Math.max(
    0,
    totalAmount - recoveredAmount,
  )

  const recoveryRate =
    totalAmount === 0
      ? 0
      : (recoveredAmount / totalAmount) * 100

  const completed = demoBatches.filter(
    (batch) => batch.status === 'completed',
  ).length

  const running = demoBatches.filter(
    (batch) => batch.status === 'running',
  ).length

  const scheduled = demoBatches.filter(
    (batch) => batch.status === 'scheduled',
  ).length

  const paused = demoBatches.filter(
    (batch) => batch.status === 'paused',
  ).length

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

/**
 * Simulate bulk recovery for a campaign.
 *
 * This is a synthetic/demo workflow.
 * No real payment or money movement is performed.
 */
export async function simulateBatchRecovery(
  batchId: string,
): Promise<BatchSimulationResult | undefined> {
  const batch = demoBatches.find(
    (item) => item.id === batchId,
  )

  if (!batch) {
    return undefined
  }

  const paymentsProcessed = batch.paymentCount

  const isHighValueReview =
    batch.strategyId === 'S-04'

  /*
   * Deterministic synthetic demo simulation.
   *
   * S-04 = high-value campaign where risky payments
   * require human escalation.
   */

  const escalatedPayments = isHighValueReview
    ? Math.max(
        1,
        Math.round(paymentsProcessed * 0.18),
      )
    : Math.round(
        paymentsProcessed * 0.04,
      )

  const recoveryAttempts = Math.max(
    0,
    Math.round(
      paymentsProcessed * 0.88,
    ) -
      (isHighValueReview ? 1 : 0),
  )

  const recoveredPayments = isHighValueReview
    ? Math.max(
        0,
        Math.round(
          paymentsProcessed * 0.73,
        ),
      )
    : Math.round(
        paymentsProcessed * 0.80,
      )

  const failedPayments = Math.max(
    0,
    recoveryAttempts - recoveredPayments,
  )

  /*
   * Payments that could not proceed because of
   * policy, stopping rules, retry limits, etc.
   */
  const stoppedPayments = Math.max(
    0,
    paymentsProcessed -
      recoveredPayments -
      failedPayments -
      escalatedPayments,
  )

  /*
   * Calculate simulated recovery amount.
   */
  const simulatedRecoveredAmount = Math.round(
    batch.totalAmount *
      Math.min(
        0.92,
        recoveredPayments / paymentsProcessed,
      ),
  )

  /*
   * Full 8-stage RecoverAI batch pipeline.
   */
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

  // -------------------------------------------------------------------------
  // Persist the simulation result into the shared demo store.
  // -------------------------------------------------------------------------

  batch.status = 'completed'
  batch.progress = 1

  batch.recoveredAmount = Math.max(
    batch.recoveredAmount,
    simulatedRecoveredAmount,
  )

  batch.completedAt = sessionTimestamp()

  /*
   * Always return the persisted value.
   *
   * This keeps:
   *
   * Campaign Card
   *      =
   * Simulation Result
   *      =
   * Batch Metrics
   *
   * after repeated simulations.
   */

  const finalRecoveredAmount =
    batch.recoveredAmount

  const finalPendingAmount = Math.max(
    0,
    batch.totalAmount -
      finalRecoveredAmount,
  )

  const finalRecoveryRate =
    batch.totalAmount === 0
      ? 0
      : (finalRecoveredAmount /
          batch.totalAmount) *
        100

  // -------------------------------------------------------------------------
  // Update matching synthetic payments.
  //
  // DEMO_SIMULATION_PAYMENT_IDS are excluded so the curated
  // Agent Command Center demo scenarios remain untouched.
  // -------------------------------------------------------------------------

  const candidatePayments =
    demoPayments.filter(
      (payment) =>
        (
          payment.status === 'at-risk' ||
          payment.status === 'in-progress'
        ) &&
        !(
          DEMO_SIMULATION_PAYMENT_IDS as readonly string[]
        ).includes(payment.id),
    )

  const recoverCount = Math.min(
    recoveredPayments,
    candidatePayments.length,
  )

  /*
   * Use slice + for...of instead of candidatePayments[i].
   *
   * This avoids TypeScript's possible-undefined indexing error.
   */
  for (const payment of candidatePayments.slice(
    0,
    recoverCount,
  )) {
    payment.status = 'recovered'
    payment.attempts += 1
    payment.updatedAt = sessionTimestamp()

    notifyRuntimeChange(
      'payment-updated',
      payment.id,
    )
  }

  // -------------------------------------------------------------------------
  // Update strategy coverage.
  // -------------------------------------------------------------------------

  const strategy = demoStrategies.find(
    (item) => item.id === batch.strategyId,
  )

  if (strategy) {
    strategy.paymentsCovered += recoverCount
  }

  // -------------------------------------------------------------------------
  // Record audit event.
  // -------------------------------------------------------------------------

  await recordAuditEvent({
    id: `A-batch-${batch.id}-${Date.now()}`,
    actor: 'system',
    action:
      `Batch ${batch.name} completed — ` +
      `${recoverCount} payments recovered, ` +
      `${escalatedPayments} escalated, ` +
      `${stoppedPayments} stopped.`,
    target: batch.id,
    timestamp: sessionTimestamp(),
    status: 'info',
  })

  // Notify runtime subscribers.
  notifyRuntimeChange(
    'batch-simulated',
    batch.id,
  )

  // -------------------------------------------------------------------------
  // Return final persisted values.
  // -------------------------------------------------------------------------

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

    recoveredAmount:
      finalRecoveredAmount,

    pendingAmount:
      finalPendingAmount,

    recoveryRate:
      finalRecoveryRate,

    steps: stages,
  }
}

