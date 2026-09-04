/**
 * AI Recommendation Service - orchestrates AI vs deterministic fallback.
 *
 * Flow:
 * 1. Build context from existing demo store (payment, outcomes, actions).
 * 2. If AI_API_KEY is set, call the LLM via fetch-llm-provider.
 * 3. On any failure (timeout, 401, invalid response, etc.), fall back to
 *    deterministic recommendation.
 * 4. Record an audit event for every recommendation.
 *
 * The Policy Engine remains authoritative - AI output is input to policy,
 * never a replacement for it.
 */
import type { Payment, RecoveryActionType, RecoveryChannel } from '@/types'
import { recordAuditEvent } from '@/services/audit-service'
import { notifyRuntimeChange } from '@/lib/runtime-events'
import type {
  AIRecommendation,
  AIRecommendationContext,
  AIRecommendationStatus,
} from '@/lib/ai/ai-types'
import { fetchLLMRecommendation, LLMProviderError } from '@/lib/ai/fetch-llm-provider'
import { getDeterministicRecommendation } from '@/lib/ai/deterministic-fallback'
import { demoRecoveryOutcomes, demoRecoveryActions } from '@/data/demo'

function buildContext(payment: Payment): AIRecommendationContext {
  const previousOutcomes = demoRecoveryOutcomes
    .filter((o) => o.paymentId === payment.id)
    .map((o) => ({ action: o.action, result: o.result, channel: o.channel }))

  const previousActions = demoRecoveryActions.filter((a) => a.paymentId === payment.id)
  const failedStrategyChannels: RecoveryChannel[] = []
  for (const action of previousActions) {
    if (action.status === 'failed' && !failedStrategyChannels.includes(action.channel)) {
      failedStrategyChannels.push(action.channel)
    }
  }

  return {
    paymentId: payment.id,
    amount: payment.amount,
    channel: payment.channel,
    failureReason: payment.failureReason ?? null,
    attempts: payment.attempts,
    risk: payment.risk,
    segment: payment.segment,
    recoveryProbability: payment.recoveryProbability,
    customerName: payment.customerName,
    previousOutcomes,
    hasPriorFailure: previousOutcomes.some((o) => o.result === 'failed'),
    failedStrategyChannels,
  }
}

function buildStatus(
  usedAI: boolean,
  source: AIRecommendationStatus['source'],
  provider: string,
  model: string,
  latencyMs: number,
  fallbackReason?: string,
): AIRecommendationStatus {
  return { usedAI, source, provider, model, latencyMs, fallbackReason }
}

/**
 * Get AI recommendation for a payment.
 * Tries LLM first if AI_API_KEY is set; otherwise uses deterministic fallback.
 */
export async function getAIRecommendation(payment: Payment): Promise<AIRecommendation> {
  const context = buildContext(payment)
  const provider = process.env.AI_PROVIDER || 'openai'
  const model = process.env.AI_MODEL || 'gpt-4o-mini'
  const apiKey = process.env.AI_API_KEY
  const timeoutMs = 10_000

  if (!apiKey) {
    const fallback = getDeterministicRecommendation(context)
    const recommendation: AIRecommendation = {
      ...fallback,
      status: buildStatus(false, 'deterministic-fallback', 'deterministic', 'rule-based', 0, 'AI_API_KEY not configured'),
    }
    await auditRecommendation(payment, recommendation)
    return recommendation
  }

  const startTime = Date.now()
  try {
    const recommendation = await fetchLLMRecommendation(context, {
      provider: provider as 'openai' | 'anthropic' | 'google' | 'deterministic',
      model,
      apiKey,
      timeoutMs,
      maxRetries: 1,
    })
    recommendation.status.latencyMs = Date.now() - startTime
    recommendation.status.usedAI = true
    recommendation.status.source = 'ai-llm'
    recommendation.status.provider = provider
    recommendation.status.model = model
    await auditRecommendation(payment, recommendation)
    return recommendation
  } catch (err) {
    const fallback = getDeterministicRecommendation(context)
    const latencyMs = Date.now() - startTime
    const reason = err instanceof LLMProviderError ? err.message : (err instanceof Error ? err.message : 'Unknown error')
    const recommendation: AIRecommendation = {
      ...fallback,
      status: buildStatus(false, 'deterministic-fallback', 'deterministic', 'rule-based', latencyMs, reason),
    }
    await auditRecommendation(payment, recommendation)
    return recommendation
  }
}

async function auditRecommendation(payment: Payment, recommendation: AIRecommendation): Promise<void> {
  await recordAuditEvent({
    id: `A-AI-${Date.now()}`,
    actor: 'ai-agent',
    action: recommendation.status.usedAI ? 'AI recommendation' : 'Fallback recommendation',
    target: payment.id,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'info',
  })
  notifyRuntimeChange('ai-recommendation', payment.id)
}