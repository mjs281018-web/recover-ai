/**
 * Deterministic Fallback — rule-based recovery recommendation engine.
 *
 * Used when:
 * - No AI API key is configured
 * - AI provider is unavailable
 * - AI response is invalid/malformed
 *
 * Reuses existing strategy matching and outcome learning signals.
 */
import type { AIRecommendation, AIRecommendationContext } from './ai-types'
import type { RecoveryActionType, RecoveryChannel, RiskLevel } from '@/types'

const CHANNEL_PRIORITY: RecoveryChannel[] = ['upi', 'card', 'netbanking', 'wallet', 'mandate']

function getFailedChannels(outcomes: AIRecommendationContext['previousOutcomes']): Set<RecoveryChannel> {
  const failed = new Set<RecoveryChannel>()
  for (const o of outcomes) {
    if (o.result === 'failed') {
      failed.add(o.channel)
    }
  }
  return failed
}

function getSuccessfulChannel(outcomes: AIRecommendationContext['previousOutcomes']): RecoveryChannel | null {
  for (const o of outcomes) {
    if (o.result === 'recovered') {
      return o.channel
    }
  }
  return null
}

function selectChannel(context: AIRecommendationContext): RecoveryChannel {
  const failedChannels = getFailedChannels(context.previousOutcomes)
  const successfulChannel = getSuccessfulChannel(context.previousOutcomes)

  // If we have a successful channel from previous outcomes, prefer it.
  if (successfulChannel && !failedChannels.has(successfulChannel)) {
    return successfulChannel
  }

  // Otherwise, pick the first non-failed channel from priority list.
  for (const channel of CHANNEL_PRIORITY) {
    if (!failedChannels.has(channel) && channel !== context.channel) {
      return channel
    }
  }

  // Fallback to current channel if nothing else works.
  return context.channel
}

function selectAction(context: AIRecommendationContext, channel: RecoveryChannel): RecoveryActionType {
  const hasFailedAttempt = context.previousOutcomes.some((o) => o.result === 'failed')

  // If previous attempts failed, try switching channel.
  if (hasFailedAttempt && channel !== context.channel) {
    return 'switch-channel'
  }

  // If high confidence and low attempts, retry.
  if (context.recoveryProbability >= 0.7 && context.attempts < 2) {
    return 'retry'
  }

  // If medium confidence, use smart retry.
  if (context.recoveryProbability >= 0.5) {
    return 'smart-retry'
  }

  // If low confidence, send reminder.
  if (context.recoveryProbability >= 0.3) {
    return 'send-reminder'
  }

  // Otherwise hold.
  return 'hold'
}

function buildReasoning(context: AIRecommendationContext, action: RecoveryActionType, channel: RecoveryChannel): string {
  const parts: string[] = []

  if (context.previousOutcomes.length > 0) {
    const failedCount = context.previousOutcomes.filter((o) => o.result === 'failed').length
    if (failedCount > 0) {
      parts.push(`${failedCount} previous recovery attempt(s) failed.`)
    }
  }

  if (action === 'switch-channel') {
    parts.push(`Switching from ${context.channel} to ${channel} based on previous outcome patterns.`)
  } else if (action === 'retry') {
    parts.push(`High recovery probability (${Math.round(context.recoveryProbability * 100)}%) supports immediate retry.`)
  } else if (action === 'smart-retry') {
    parts.push(`Moderate recovery probability suggests optimized retry timing.`)
  } else if (action === 'send-reminder') {
    parts.push(`Customer engagement recommended before retry attempt.`)
  } else {
    parts.push(`Conservative approach recommended given current risk profile.`)
  }

  return parts.join(' ')
}

function assessRisk(context: AIRecommendationContext): RiskLevel {
  if (context.risk === 'critical' || context.risk === 'high') {
    return context.risk
  }
  if (context.amount > 50000) {
    return 'high'
  }
  if (context.amount > 10000) {
    return 'medium'
  }
  return 'low'
}

export function getDeterministicRecommendation(context: AIRecommendationContext): Omit<AIRecommendation, 'status'> {
  const channel = selectChannel(context)
  const action = selectAction(context, channel)
  const riskLevel = assessRisk(context)
  const confidence = Math.min(0.95, context.recoveryProbability + (context.previousOutcomes.length > 0 ? 0.1 : 0))

  const alternativeActions: RecoveryActionType[] = []
  if (action !== 'retry') alternativeActions.push('retry')
  if (action !== 'smart-retry') alternativeActions.push('smart-retry')
  if (action !== 'switch-channel' && channel !== context.channel) alternativeActions.push('switch-channel')
  if (action !== 'hold') alternativeActions.push('hold')

  const escalationRecommended = riskLevel === 'critical' || riskLevel === 'high' || context.amount > 50000

  return {
    recommendedAction: action,
    recommendedChannel: channel,
    reasoning: buildReasoning(context, action, channel),
    confidence,
    riskLevel,
    alternativeActions: alternativeActions.slice(0, 3),
    escalationRecommended,
  }
}