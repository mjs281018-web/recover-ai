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

export const DEMO_PROVIDER_LABEL = 'DEMO PROVIDER — SYNTHETIC'

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
    return {
      ok: payment.recoveryProbability >= 0.5,
      message: `Synthetic retry simulated for ${paymentId} — no real charge was attempted.`,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<Payment['status'] | undefined> {
    return demoPayments.find((p) => p.id === paymentId)?.status
  }

  async recordRecoveryOutcome(outcome: RecoveryOutcome): Promise<RecoveryOutcome> {
    demoRecoveryOutcomes.push(outcome)
    return outcome
  }
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
