/**
 * Policy service — the guardrails and limits that constrain what the
 * agent may do autonomously. Wraps the synthetic demo dataset.
 */
import type { Policy } from '@/types'
import { demoPolicies } from '@/data/demo'

export async function listPolicies(): Promise<Policy[]> {
  return [...demoPolicies].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export async function getPolicy(policyId: string): Promise<Policy | undefined> {
  return demoPolicies.find((p) => p.id === policyId)
}
