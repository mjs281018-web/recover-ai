/**
 * AI Provider Abstraction — defines the contract for AI-assisted recovery decisions.
 *
 * The AI provider analyzes payment context and recommends recovery strategies.
 * It does NOT execute recovery — the Policy Engine remains the final authority.
 *
 * Two implementations exist:
 * 1. LLMProvider — calls a real LLM API when credentials are configured
 * 2. DeterministicFallbackProvider — uses existing strategy logic when AI is unavailable
 */

import type { Payment, RecoveryActionType, RecoveryChannel, RiskLevel } from '@/types'

/**
 * Context provided to the AI for making a recovery recommendation.
 * Structured to give the LLM all relevant information without exposing sensitive data.
 */
export interface AIAnalysisContext {
  payment: {
    id: string
    amount: number
    channel: RecoveryChannel
    method: string
    failureReason: string | null
    attempts: number
    risk: RiskLevel
    segment: string
    recoveryProbability: number
    status: string
  }
  customer: {
    name: string
    segment: string
    riskProfile: RiskLevel
    totalPayments: number
    recoveredCount: number
    failedCount: number
  } | null
  history: {
    previousAttempts: number
    previousFailures: number
    previousSuccesses: number
    lastFailedAction: RecoveryActionType | null
    lastFailedChannel: RecoveryChannel | null
  }
  availableStrategies: {
    id: string
    name: string
    successRate: number
    channelPriority: RecoveryChannel[]
  }[]
  channelPerformance: {
    channel: RecoveryChannel
    successRate: number
    attempts: number
  }[]
}

/**
 * Structured output from the AI provider.
 * Must be validated before use — raw LLM output is not trusted.
 */
export interface AIRecommendation {
  /** Recommended recovery action type */
  recommendedAction: RecoveryActionType
  /** Recommended channel to attempt recovery on */
  recommendedChannel: RecoveryChannel
  /** Human-readable explanation of the recommendation */
  reasoning: string
  /** AI confidence in this recommendation (0-1) */
  confidence: number
  /** Assessed risk level for this recovery attempt */
  riskLevel: RiskLevel
  /** Alternative actions if the primary recommendation fails */
  alternativeActions: RecoveryActionType[]
  /** Whether human escalation is recommended */
  escalateToHuman: boolean
  /** Source indicator — shows whether this came from AI or fallback */
  source: 'ai-llm' | 'deterministic-fallback'
}

/**
 * AI Provider interface — implement this to add new AI backends.
 */
export interface AIProvider {
  /** Unique identifier for this provider */
  readonly name: string
  /** Whether this provider is currently available */
  isAvailable(): boolean
  /**
   * Analyze payment context and return a structured recommendation.
   * Must never throw — returns a valid recommendation or throws AIProviderError.
   */
  analyze(context: AIAnalysisContext): Promise<AIRecommendation>
}

/**
 * Error thrown when AI analysis fails.
 * Callers should catch this and use deterministic fallback.
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

/**
 * No AI provider is available — use deterministic fallback.
 */
export class NoAIProviderError extends Error {
  constructor(message: string = 'No AI provider configured or available') {
    super(message)
    this.name = 'NoAIProviderError'
  }
}