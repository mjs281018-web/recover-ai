/**
 * Payment service — the only layer UI code should use to read or act on
 * payments. Wraps the synthetic demo dataset today; swap the provider in
 * `@/lib/providers/payment-provider` for a live payment API integration
 * without changing any calling component.
 */
import type { Payment, PaymentStatus, RiskLevel } from '@/types'
import { demoPayments } from '@/data/demo'
import { getPaymentProvider } from '@/lib/providers/payment-provider'

export interface PaymentFilters {
  status?: PaymentStatus | PaymentStatus[]
  risk?: RiskLevel
  customerId?: string
}

function matches(payment: Payment, filters?: PaymentFilters): boolean {
  if (!filters) return true
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    if (!statuses.includes(payment.status)) return false
  }
  if (filters.risk && payment.risk !== filters.risk) return false
  if (filters.customerId && payment.customerId !== filters.customerId) return false
  return true
}

/** List payments, optionally filtered. Sorted most-recent first. */
export async function listPayments(filters?: PaymentFilters): Promise<Payment[]> {
  return demoPayments
    .filter((p) => matches(p, filters))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function getPayment(paymentId: string): Promise<Payment | undefined> {
  return getPaymentProvider().getPayment(paymentId)
}

/** Payments the recovery engine currently considers at risk of failing to recover. */
export async function listAtRiskPayments(): Promise<Payment[]> {
  return listPayments({ status: ['at-risk', 'pending-approval'] })
}

/** Kick off a retry attempt through the active payment provider. */
export async function retryPayment(paymentId: string) {
  return getPaymentProvider().retryPayment(paymentId)
}
