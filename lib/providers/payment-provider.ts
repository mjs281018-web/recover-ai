/**
 * Payment provider abstraction.
 * ---------------------------------------------------------------------
 * This is the integration seam between RecoverAI and a real payment
 * processor. Today only a synthetic, in-memory implementation exists
 * (`SyntheticPaymentProvider`) — no real payment API, no real money
 * movement, and no credentials are involved anywhere in this file.
 *
 * When a real integration is ready, implement `PaymentProvider` against
 * the target processor (Razorpay, Stripe, a payment gateway aggregator,
 * etc.) and swap it in via `getPaymentProvider()` without touching the
 * services or UI layers that depend on this interface.
 */

import type { Payment, RecoveryOutcome } from '@/types'
import { demoPayments, demoRecoveryOutcomes, demoCustomers } from '@/data/demo'
import { notifyRuntimeChange } from '@/lib/runtime-events'

export const DEMO_PROVIDER_LABEL = 'DEMO PROVIDER — SYNTHETIC'

/** Original payment rows captured before a session mutation, keyed by payment id. */
const paymentSnapshots = new Map<string, Payment>()
/** Outcome ids appended during this session so Reset can drop them. */
const sessionOutcomeIds = new Set<string>()

function rememberPayment(payment: Payment) {
  if (!paymentSnapshots.has(payment.id)) {
    paymentSnapshots.set(payment.id, { ...payment })
  }
}

export interface PaymentProvider {
  /** Fetch a single payment by id. */
  getPayment(paymentId: string): Promise<Payment | undefined>
  /** Fetch every payment associated with a customer. */
  getCustomerHistory(customerId: string): Promise<Payment[]>
  /** Trigger a retry attempt for a payment. Synthetic providers simulate the result. */
  retryPayment(paymentId: string): Promise<{ ok: boolean; message: string }>
  /** Look up the current status of a payment. */
  getPaymentStatus(paymentId: string): Promise<Payment['status'] | undefined>
  /** Persist the outcome of a recovery attempt. */
  recordRecoveryOutcome(outcome: RecoveryOutcome): Promise<RecoveryOutcome>
}

/**
 * SyntheticPaymentProvider — DEMO PROVIDER — SYNTHETIC.
 * Operates entirely on the in-memory demo dataset. Mutations are held
 * in-process only and reset on reload; nothing here talks to a network,
 * a database, or a real payment processor.
 */
export class SyntheticPaymentProvider implements PaymentProvider {
  readonly label = DEMO_PROVIDER_LABEL

  async getPayment(paymentId: string): Promise<Payment | undefined> {
    return demoPayments.find((p) => p.id === paymentId)
  }

  async getCustomerHistory(customerId: string): Promise<Payment[]> {
    return demoPayments.filter((p) => p.customerId === customerId)
  }

  async retryPayment(paymentId: string): Promise<{ ok: boolean; message: string }> {
    const payment = demoPayments.find((p) => p.id === paymentId)
    if (!payment) {
      return { ok: false, message: `No synthetic payment found for ${paymentId}.` }
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

    rememberPayment(payment)
    payment.attempts += 1
    payment.updatedAt = new Date().toISOString()

    const ok = payment.recoveryProbability >= 0.5
    if (ok) {
      payment.status = 'recovered'
      notifyRuntimeChange('payment-updated', paymentId)
      return {
        ok: true,
        message: `Synthetic retry succeeded for ${paymentId} — in-memory status set to recovered. No real charge was attempted.`,
      }
    }

    payment.status = 'failed'
    notifyRuntimeChange('payment-updated', paymentId)
    return {
      ok: false,
      message: `Synthetic retry did not recover ${paymentId} — in-memory status set to failed. No real charge was attempted.`,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<Payment['status'] | undefined> {
    return demoPayments.find((p) => p.id === paymentId)?.status
  }

  async recordRecoveryOutcome(outcome: RecoveryOutcome): Promise<RecoveryOutcome> {
    demoRecoveryOutcomes.push(outcome)
    sessionOutcomeIds.add(outcome.id)
    notifyRuntimeChange('recovery-action', outcome.paymentId)
    return outcome
  }
}

/**
 * Restore a payment (and session-appended outcomes for it) to the demo seed.
 * Session-only — nothing is written to disk.
 */
export async function resetSyntheticSimulation(paymentId: string): Promise<void> {
  const original = paymentSnapshots.get(paymentId)
  if (original) {
    const index = demoPayments.findIndex((p) => p.id === paymentId)
    if (index >= 0) {
      demoPayments[index] = { ...original }
    }
    paymentSnapshots.delete(paymentId)
  }

  for (let i = demoRecoveryOutcomes.length - 1; i >= 0; i--) {
    const outcome = demoRecoveryOutcomes[i]
    if (sessionOutcomeIds.has(outcome.id) && outcome.paymentId === paymentId) {
      demoRecoveryOutcomes.splice(i, 1)
      sessionOutcomeIds.delete(outcome.id)
    }
  }
  notifyRuntimeChange('reset', paymentId)
}

/** Confirms a customer id exists in the synthetic dataset (used by services). */
export async function customerExists(customerId: string): Promise<boolean> {
  return demoCustomers.some((c) => c.id === customerId)
}

let providerInstance: PaymentProvider | null = null

/** Returns the active payment provider. Currently always synthetic. */
export function getPaymentProvider(): PaymentProvider {
  if (!providerInstance) {
    providerInstance = new SyntheticPaymentProvider()
  }
  return providerInstance
}
