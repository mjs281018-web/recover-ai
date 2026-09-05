
/**
 * Payment provider abstraction.
 * ---------------------------------------------------------------------
 * RecoverAI currently uses a synthetic, in-memory payment provider.
 * No real payment API, credentials, or money movement are used here.
 */

import type { Payment, RecoveryOutcome } from '@/types'
import {
  demoPayments,
  demoRecoveryOutcomes,
  demoCustomers,
} from '@/data/demo'
import { notifyRuntimeChange } from '@/lib/runtime-events'

export const DEMO_PROVIDER_LABEL = 'DEMO PROVIDER — SYNTHETIC'

/**
 * Stores the original state of payments before a session mutation.
 * Used by resetSyntheticSimulation().
 */
const paymentSnapshots = new Map<string, Payment>()

/**
 * Stores recovery outcome IDs created during the current session.
 * Used by resetSyntheticSimulation().
 */
const sessionOutcomeIds = new Set<string>()

/**
 * Capture the original state of a payment before mutating it.
 */
function rememberPayment(payment: Payment): void {
  if (!paymentSnapshots.has(payment.id)) {
    paymentSnapshots.set(payment.id, { ...payment })
  }
}

/**
 * Resume a payment after human approval.
 *
 * A payment in pending-approval state is moved back to at-risk so
 * the existing recovery pipeline can execute it.
 *
 * This only changes the synthetic in-memory demo state.
 * No real payment operation is performed.
 */
export function resumeSyntheticPayment(
  paymentId: string,
): Payment | undefined {
  const payment = demoPayments.find(
    (p) => p.id === paymentId,
  )

  if (!payment) {
    return undefined
  }

  if (payment.status === 'pending-approval') {
    rememberPayment(payment)

    payment.status = 'at-risk'
    payment.updatedAt = new Date().toISOString()

    notifyRuntimeChange(
      'payment-updated',
      paymentId,
    )
  }

  return payment
}

/**
 * Payment provider interface.
 */
export interface PaymentProvider {
  /**
   * Fetch a single payment by ID.
   */
  getPayment(
    paymentId: string,
  ): Promise<Payment | undefined>

  /**
   * Fetch payment history for a customer.
   */
  getCustomerHistory(
    customerId: string,
  ): Promise<Payment[]>

  /**
   * Execute a synthetic retry.
   */
  retryPayment(
    paymentId: string,
  ): Promise<{
    ok: boolean
    message: string
  }>

  /**
   * Get the current payment status.
   */
  getPaymentStatus(
    paymentId: string,
  ): Promise<Payment['status'] | undefined>

  /**
   * Record a recovery outcome.
   */
  recordRecoveryOutcome(
    outcome: RecoveryOutcome,
  ): Promise<RecoveryOutcome>
}

/**
 * Register a payment received from the demo Razorpay integration.
 *
 * This operates only on the browser-side synthetic demo dataset.
 * It does not send anything to Razorpay.
 */
export function registerSyntheticPayment(
  payment: Payment,
): Payment {
  const existingIndex = demoPayments.findIndex(
    (p) => p.id === payment.id,
  )

  if (existingIndex >= 0) {
    demoPayments[existingIndex] = payment
  } else {
    demoPayments.unshift(payment)
  }

  notifyRuntimeChange(
    'payment-updated',
    payment.id,
  )

  return payment
}

/**
 * Synthetic payment provider.
 *
 * All payment mutations are in-memory only.
 * No real charge or retry is performed.
 */
export class SyntheticPaymentProvider
  implements PaymentProvider
{
  readonly label = DEMO_PROVIDER_LABEL

  async getPayment(
    paymentId: string,
  ): Promise<Payment | undefined> {
    return demoPayments.find(
      (p) => p.id === paymentId,
    )
  }

  async getCustomerHistory(
    customerId: string,
  ): Promise<Payment[]> {
    return demoPayments.filter(
      (p) => p.customerId === customerId,
    )
  }

  async retryPayment(
    paymentId: string,
  ): Promise<{
    ok: boolean
    message: string
  }> {
    const payment = demoPayments.find(
      (p) => p.id === paymentId,
    )

    if (!payment) {
      return {
        ok: false,
        message: `No synthetic payment found for ${paymentId}.`,
      }
    }

    if (payment.status === 'recovered') {
      return {
        ok: true,
        message: `Payment ${paymentId} is already recovered — no synthetic retry was attempted.`,
      }
    }

    if (payment.status === 'blocked') {
      return {
        ok: false,
        message: `Payment ${paymentId} is blocked — synthetic retries are not permitted.`,
      }
    }

    if (payment.status === 'pending-approval') {
      return {
        ok: false,
        message: `Payment ${paymentId} is awaiting human approval — synthetic retry was not executed.`,
      }
    }

    /**
     * Capture the executable state before mutation.
     * This allows Reset to restore the correct state.
     */
    rememberPayment(payment)

    payment.attempts += 1
    payment.updatedAt = new Date().toISOString()

    /**
     * Synthetic recovery rule:
     * recoveryProbability >= 0.5 => success
     * recoveryProbability < 0.5  => failure
     */
    const ok =
      payment.recoveryProbability >= 0.5

    if (ok) {
      payment.status = 'recovered'

      notifyRuntimeChange(
        'payment-updated',
        paymentId,
      )

      return {
        ok: true,
        message:
          `Synthetic retry succeeded for ${paymentId} — ` +
          `in-memory status set to recovered. ` +
          `No real charge was attempted.`,
      }
    }

    payment.status = 'failed'

    notifyRuntimeChange(
      'payment-updated',
      paymentId,
    )

    return {
      ok: false,
      message:
        `Synthetic retry did not recover ${paymentId} — ` +
        `in-memory status set to failed. ` +
        `No real charge was attempted.`,
    }
  }

  async getPaymentStatus(
    paymentId: string,
  ): Promise<Payment['status'] | undefined> {
    return demoPayments.find(
      (p) => p.id === paymentId,
    )?.status
  }

  async recordRecoveryOutcome(
    outcome: RecoveryOutcome,
  ): Promise<RecoveryOutcome> {
    demoRecoveryOutcomes.push(outcome)

    sessionOutcomeIds.add(outcome.id)

    notifyRuntimeChange(
      'recovery-action',
      outcome.paymentId,
    )

    return outcome
  }
}

/**
 * Reset a synthetic payment and its session recovery outcomes
 * back to the original demo state.
 *
 * Session-only operation.
 * Nothing is written to disk or sent to a payment processor.
 */
export async function resetSyntheticSimulation(
  paymentId: string,
): Promise<void> {
  const original =
    paymentSnapshots.get(paymentId)

  if (original) {
    const index = demoPayments.findIndex(
      (p) => p.id === paymentId,
    )

    if (index >= 0) {
      demoPayments[index] = {
        ...original,
      }
    }

    paymentSnapshots.delete(paymentId)
  }

  for (
    let i = demoRecoveryOutcomes.length - 1;
    i >= 0;
    i--
  ) {
    const outcome =
      demoRecoveryOutcomes[i]

    if (
      sessionOutcomeIds.has(outcome.id) &&
      outcome.paymentId === paymentId
    ) {
      demoRecoveryOutcomes.splice(i, 1)

      sessionOutcomeIds.delete(
        outcome.id,
      )
    }
  }

  notifyRuntimeChange(
    'reset',
    paymentId,
  )
}

/**
 * Check whether a customer exists in the
 * synthetic demo dataset.
 */
export async function customerExists(
  customerId: string,
): Promise<boolean> {
  return demoCustomers.some(
    (customer) =>
      customer.id === customerId,
  )
}

let providerInstance:
  PaymentProvider | null = null

/**
 * Return the active payment provider.
 *
 * Currently this always returns the synthetic provider.
 */
export function getPaymentProvider(): PaymentProvider {
  if (!providerInstance) {
    providerInstance =
      new SyntheticPaymentProvider()
  }

  return providerInstance
}

