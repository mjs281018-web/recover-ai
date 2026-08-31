/**
 * Customer service — account and mandate context for the recovery engine
 * and UI. Wraps the synthetic demo dataset for the foundation phase.
 */
import type { Customer } from '@/types'
import { demoCustomers } from '@/data/demo'
import { getPaymentProvider } from '@/lib/providers/payment-provider'

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
