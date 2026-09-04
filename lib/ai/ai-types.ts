import type { RecoveryActionType, RecoveryChannel, RiskLevel } from '@/types'

/**
 * AI provider abstraction types for RecoverAI.
 *
 * The AI layer recommends recovery strategies but NEVER has final authority.
 * The Policy Engine remains the final authority on ALLOW / APPROVAL REQUIRED / BLOCK.
 */

/** Source of the recommendation — shown in UI for transparency. */
export type RecommendationSource = 'ai-llm' | 'deterministic-fallback'

/** Status of the AI recommendation attempt. */
export interface AIRecommendationStatus {
  /** Whether the AI/LLM was actually used (vs deterministic fallback). */
  usedAI: boolean
  /** The source of the recommendation. */
  source: RecommendationSource
  /** Provider identifier (e.g., 'openai', 'anthropic', 'deterministic'). */
  provider: string
  /** Model identifier if LLM was used, else 'deterministic'. */
  model: string
  /** Error message if AI failed and fallback was used. */
  fallbackReason?: string
  /** Time taken to generate the recommendation in ms. */
  latencyMs: number
}

/** Input context for AI recommendation — all derived from existing demo store. */
export interface AIRecommendationContext {
  paymentId: string
  amount: number
  channel: RecoveryChannel
  failureReason: string | null
  attempts: number
  risk: RiskLevel
  segment: string
  recoveryProbability: number
  customerName: string
  /** Previous recovery outcomes for this payment, if any. */
  previousOutcomes: Array<{
    action: RecoveryActionType
    result: 'recovered' | 'failed' | 'pending'
    channel: RecoveryChannel
  }>
  /** Whether any previous attempt failed. */
  hasPriorFailure: boolean
  /** Strategies that previously failed for this payment. */
  failedStrategyChannels: RecoveryChannel[]
}

/** Validated, structured AI recommendation output. */
export interface AIRecommendation {
  /** Recommended recovery action type. */
  recommendedAction: RecoveryActionType
  /** Recommended channel for recovery. */
  recommendedChannel: RecoveryChannel
  /** Human-readable reasoning for the recommendation. */
  reasoning: string
  /** Confidence score [0, 1]. */
  confidence: number
  /** Assessed risk level. */
  riskLevel: RiskLevel
  /** Alternative strategies if primary fails. */
  alternativeActions: RecoveryActionType[]
  /** Whether human escalation is recommended. */
  escalationRecommended: boolean
  /** Status metadata about how this recommendation was generated. */
  status: AIRecommendationStatus
}

/** Result of AI recommendation after policy enforcement. */
export interface AIEnforcedRecommendation {
  /** The raw AI recommendation. */
  recommendation: AIRecommendation
  /** Policy evaluation result. */
  policyVerdict: 'allowed' | 'requiresApproval' | 'blocked'
  /** Policy reason if blocked or requires approval. */
  policyReason: string
  /** Final action after policy enforcement. */
  finalAction: RecoveryActionType
  /** Whether execution can proceed. */
  canExecute: boolean
}

/** Supported LLM providers. */
export type LLMProviderId = 'openai' | 'anthropic' | 'google' | 'deterministic'

/** Configuration for AI provider selection. */
export interface AIConfig {
  /** Selected provider identifier. */
  provider: LLMProviderId
  /** Model identifier (ignored for deterministic fallback). */
  model: string
  /** API key (server-side only, never exposed to client). */
  apiKey?: string
  /** Request timeout in milliseconds. */
  timeoutMs: number
  /** Maximum retries for transient failures. */
  maxRetries: number
}