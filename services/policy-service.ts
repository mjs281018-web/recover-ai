/**
 * Policy service — the guardrails and limits that constrain what the
 * agent may do autonomously. Wraps the synthetic demo dataset.
 */
import type { Payment, Policy, PolicyEvaluation, RecoveryActionType, RiskLevel } from '@/types'
import { demoPolicies } from '@/data/demo'

export async function listPolicies(): Promise<Policy[]> {
  return [...demoPolicies].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export async function getPolicy(policyId: string): Promise<Policy | undefined> {
  return demoPolicies.find((p) => p.id === policyId)
}

const ELEVATED_RISK: RiskLevel[] = ['medium', 'high', 'critical']

const AUTONOMOUS_RETRY_ACTIONS: RecoveryActionType[] = ['retry', 'smart-retry', 'switch-channel', 'send-reminder']

function evaluation(
  verdict: PolicyEvaluation['verdict'],
  policyId: string,
  reason: string,
): PolicyEvaluation {
  return {
    verdict,
    allowed: verdict === 'allowed',
    requiresApproval: verdict === 'requiresApproval',
    blocked: verdict === 'blocked',
    policyId,
    reason,
  }
}

/**
 * Evaluate active demo policies against a payment and intended recovery action.
 * Restrictive guardrails win: block → approval threshold → retry limit → allow.
 */
export async function evaluatePolicy(
  payment: Payment,
  recommendedAction: RecoveryActionType,
): Promise<PolicyEvaluation> {
  const active = demoPolicies.filter((p) => p.status === 'active')
  const byId = (id: string) => active.find((p) => p.id === id)

  const fraudHold = byId('PL-05')
  if (
    fraudHold &&
    (payment.failureReason === 'fraud-suspected' || payment.failureReason === 'card-lost')
  ) {
    return evaluation(
      'blocked',
      fraudHold.id,
      `${fraudHold.name}: ${fraudHold.rule} Autonomous recovery is blocked for this payment.`,
    )
  }

  const channelRule = byId('PL-03')
  if (channelRule && recommendedAction === 'switch-channel' && payment.channel === 'mandate') {
    return evaluation(
      'blocked',
      channelRule.id,
      `${channelRule.name}: mandate recoveries may not fall back to another channel automatically.`,
    )
  }

  const enterpriseGuard = byId('PL-04')
  if (
    enterpriseGuard &&
    payment.segment === 'enterprise' &&
    enterpriseGuard.threshold !== undefined &&
    payment.amount > enterpriseGuard.threshold
  ) {
    return evaluation(
      'requiresApproval',
      enterpriseGuard.id,
      `${enterpriseGuard.name}: ${enterpriseGuard.rule}`,
    )
  }

  const highValue = byId('PL-02')
  if (
    highValue &&
    highValue.threshold !== undefined &&
    payment.amount > highValue.threshold &&
    ELEVATED_RISK.includes(payment.risk)
  ) {
    return evaluation(
      'requiresApproval',
      highValue.id,
      `${highValue.name}: ${highValue.rule}`,
    )
  }

  if (recommendedAction === 'human-approval') {
    const policy = highValue ?? enterpriseGuard ?? active[0]
    return evaluation(
      'requiresApproval',
      policy?.id ?? 'PL-02',
      policy?.rule ?? 'Recommended action requires human approval before execution.',
    )
  }

  const retryLimit = byId('PL-01')
  if (
    retryLimit &&
    retryLimit.threshold !== undefined &&
    AUTONOMOUS_RETRY_ACTIONS.includes(recommendedAction) &&
    payment.attempts >= retryLimit.threshold
  ) {
    return evaluation(
      'blocked',
      retryLimit.id,
      `${retryLimit.name}: auto-retry limit of ${retryLimit.threshold} attempts has been reached.`,
    )
  }

  const standard = retryLimit ?? active[0]
  return evaluation(
    'allowed',
    standard?.id ?? 'PL-01',
    standard
      ? `${standard.name}: no approval threshold or risk guardrail triggered; autonomous action is permitted.`
      : 'No restricting active policy matched; autonomous action is permitted.',
  )
}
