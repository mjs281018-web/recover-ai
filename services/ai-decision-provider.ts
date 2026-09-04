/**
 * AI Decision Provider — abstraction for AI-assisted recovery recommendations.
 *
 * This module provides a clean interface for AI-powered payment recovery
 * decisions. It supports:
 * 1. Real LLM integration (when AI_PROVIDER and AI_API_KEY are configured)
 * 2. Deterministic fallback (when no AI provider is available)
 *
 * The AI NEVER has final authority. All recommendations are validated through
 * the existing Policy Engine before execution.
 *
 * DEMO MODE: Works without any AI API key using deterministic fallback.
 */

import type {
  RecoveryActionType,
  RecoveryChannel,
  RiskLevel,
} from '@/types'

/**
 * Structured context sent to the AI for recommendation.
 * Contains all relevant payment and customer information.
 */
export interface AIDecisionContext {
  paymentId: string
  amount: number
  channel: RecoveryChannel
  failureReason: string | null
  attempts: number
  risk: RiskLevel
  segment: string
  recoveryProbability: number
  customerName: string
  previousOutcomes: Array<{
    action: RecoveryActionType
    result: 'recovered' | 'failed' | 'pending'
    channel: RecoveryChannel
  }>
  availableChannels: RecoveryChannel[]
  strategyPerformance: Array<{
    name: string
    successRate: number
    attempts: number
  }>
}

/**
 * Structured recommendation from the AI.
 * This is the single source of truth for AI recommendations.
 */
export interface AIRecommendation {
  recommendedAction: RecoveryActionType
  recommendedChannel: RecoveryChannel
  confidence: number
  riskLevel: RiskLevel
  reasoning: string
  alternativeActions: RecoveryActionType[]
  escalationRecommended: boolean
  source: 'ai-llm' | 'deterministic-fallback'
  strategyName?: string
}

/**
 * AI Provider interface — allows swapping between LLM and fallback.
 */
export interface AIProvider {
  getRecommendation(context: AIDecisionContext): Promise<AIRecommendation>
  isAvailable(): boolean
  getProviderName(): string
}

/**
 * Validates that an AI recommendation is safe and well-formed.
 * Returns null if valid, or an error message if invalid.
 */
function validateRecommendation(rec: AIRecommendation): string | null {
  if (!rec.recommendedAction) return 'Missing recommended action'
  if (!rec.recommendedChannel) return 'Missing recommended channel'
  if (typeof rec.confidence !== 'number' || rec.confidence < 0 || rec.confidence > 1) {
    return 'Invalid confidence value'
  }
  if (!rec.reasoning || rec.reasoning.trim().length === 0) {
    return 'Missing reasoning'
  }
  const validActions: RecoveryActionType[] = [
    'retry', 'smart-retry', 'switch-channel', 'send-reminder',
    'human-approval', 'hold', 'update-payment-method', 'write-off',
  ]
  if (!validActions.includes(rec.recommendedAction)) {
    return 'Unsupported action: ' + rec.recommendedAction
  }
  const validChannels: RecoveryChannel[] = [
    'upi', 'card', 'netbanking', 'wallet', 'mandate',
  ]
  if (!validChannels.includes(rec.recommendedChannel)) {
    return 'Unsupported channel: ' + rec.recommendedChannel
  }
  return null
}

/**
 * Deterministic fallback provider — used when no AI API key is configured.
 * Uses rule-based logic with outcome learning signals.
 */
export class DeterministicFallbackProvider implements AIProvider {
  getProviderName(): string {
    return 'Deterministic Fallback'
  }

  isAvailable(): boolean {
    return true // Always available
  }

  async getRecommendation(context: AIDecisionContext): Promise<AIRecommendation> {
    const {
      amount,
      channel,
      failureReason,
      attempts,
      risk,
      recoveryProbability,
      previousOutcomes,
      availableChannels,
      strategyPerformance,
    } = context

    // Check for previous failures and adapt
    const previousFailures = previousOutcomes.filter((o) => o.result === 'failed')
    const hasFailedCardRetry = previousFailures.some(
      (o) => o.channel === 'card' && (o.action === 'retry' || o.action === 'smart-retry'),
    )
    const hasFailedUPI = previousFailures.some((o) => o.channel === 'upi')

    // Determine best channel based on strategy performance
    const sortedStrategies = [...strategyPerformance].sort(
      (a, b) => b.successRate - a.successRate,
    )
    const bestStrategy = sortedStrategies[0]

    let recommendedAction: RecoveryActionType = 'smart-retry'
    let recommendedChannel: RecoveryChannel = channel
    let reasoning = ''
    let escalationRecommended = false

    // Rule: If card retry failed, try alternate channel
    if (hasFailedCardRetry && availableChannels.includes('upi')) {
      recommendedAction = 'switch-channel'
      recommendedChannel = 'upi'
      reasoning = `Previous card retry failed. Customer has UPI available which shows better success rates. Switching channel to avoid repeated failures.`
    }
    // Rule: If UPI failed, try card
    else if (hasFailedUPI && availableChannels.includes('card')) {
      recommendedAction = 'switch-channel'
      recommendedChannel = 'card'
      reasoning = `Previous UPI attempt failed. Switching to card channel for recovery.`
    }
    // Rule: High-value + high-risk requires approval
    else if (amount > 10000 && (risk === 'high' || risk === 'critical')) {
      recommendedAction = 'human-approval'
      reasoning = `High-value payment (₹${amount.toLocaleString('en-IN')}) with ${risk} risk requires human approval per policy.`
      escalationRecommended = true
    }
    // Rule: Multiple failures suggest escalation
    else if (attempts >= 3) {
      recommendedAction = 'human-approval'
      reasoning = `${attempts} previous attempts failed. Escalating to human review for manual intervention.`
      escalationRecommended = true
    }
    // Rule: Low probability suggests hold
    else if (recoveryProbability < 0.3) {
      recommendedAction = 'hold'
      reasoning = `Low recovery probability (${(recoveryProbability * 100).toFixed(0)}%). Holding payment to avoid further failures.`
    }
    // Default: Smart retry on same channel
    else {
      recommendedAction = 'smart-retry'
      recommendedChannel = channel
      reasoning = `Standard recovery attempt. ${bestStrategy ? `Best performing strategy: ${bestStrategy.name} (${(bestStrategy.successRate * 100).toFixed(0)}% success).` : ''} Attempting ${recommendedAction} via ${recommendedChannel}.`
    }

    // Adjust confidence based on context
    let confidence = 0.75
    if (escalationRecommended) confidence = 0.9
    else if (recoveryProbability > 0.7) confidence = 0.85
    else if (recoveryProbability < 0.3) confidence = 0.6

    return {
      recommendedAction,
      recommendedChannel,
      confidence,
      riskLevel: risk,
      reasoning,
      escalationRecommended,
      source: 'deterministic-fallback',
      alternativeActions: this.getAlternatives(recommendedAction, availableChannels),
      strategyName: bestStrategy?.name,
    }
  }

  private getAlternatives(
    action: RecoveryActionType,
    channels: RecoveryChannel[],
  ): RecoveryActionType[] {
    const allActions: RecoveryActionType[] = [
      'retry', 'smart-retry', 'switch-channel', 'send-reminder',
    ]
    return allActions.filter((a) => a !== action).slice(0, 2)
  }
}

/**
 * LLM Provider — makes real API calls to an AI model.
 * Requires AI_PROVIDER and AI_API_KEY environment variables.
 */
export class LLMProvider implements AIProvider {
  private provider: string
  private model: string
  private apiKey: string | undefined

  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai'
    this.model = process.env.AI_MODEL || 'gpt-4o-mini'
    this.apiKey = process.env.AI_API_KEY
  }

  getProviderName(): string {
    return `${this.provider}/${this.model}`
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async getRecommendation(context: AIDecisionContext): Promise<AIRecommendation> {
    if (!this.apiKey) {
      throw new Error('AI_API_KEY not configured')
    }

    const prompt = this.buildPrompt(context)

    try {
      const response = await this.callLLM(prompt)
      const parsed = this.parseResponse(response, context)
      return parsed
    } catch (error) {
      // Re-throw to let caller handle fallback
      throw error
    }
  }

  private buildPrompt(context: AIDecisionContext): string {
    const {
      paymentId,
      amount,
      channel,
      failureReason,
      attempts,
      risk,
      segment,
      recoveryProbability,
      previousOutcomes,
      availableChannels,
      strategyPerformance,
    } = context

    return `You are an AI payment recovery assistant for Razorpay. Analyze this failed payment and recommend the best recovery strategy.

Payment Details:
- ID: ${paymentId}
- Amount: ₹${amount.toLocaleString('en-IN')}
- Channel: ${channel}
- Failure Reason: ${failureReason || 'Unknown'}
- Attempts: ${attempts}
- Risk Level: ${risk}
- Customer Segment: ${segment}
- Recovery Probability: ${(recoveryProbability * 100).toFixed(1)}%

Previous Outcomes:
${previousOutcomes.length > 0 ? previousOutcomes.map((o) => `- ${o.action} via ${o.channel}: ${o.result}`).join('\n') : 'No previous outcomes'}

Available Channels: ${availableChannels.join(', ')}

Strategy Performance:
${strategyPerformance.map((s) => `- ${s.name}: ${(s.successRate * 100).toFixed(0)}% success (${s.attempts} attempts)`).join('\n')}

Respond with ONLY a valid JSON object in this exact format:
{
  "recommendedAction": "retry|smart-retry|switch-channel|send-reminder|human-approval|hold|update-payment-method|write-off",
  "recommendedChannel": "upi|card|netbanking|wallet|mandate",
  "confidence": 0.0-1.0,
  "riskLevel": "low|medium|high|critical",
  "reasoning": "explanation of recommendation",
  "alternativeActions": ["action1", "action2"],
  "escalationRecommended": true|false
}`
  }

  private async callLLM(prompt: string): Promise<string> {
    // Support OpenAI-compatible APIs
    const endpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a payment recovery AI assistant. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }

  private parseResponse(
    content: string,
    context: AIDecisionContext,
  ): AIRecommendation {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
      content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    let parsed: Partial<AIRecommendation>
    try {
      parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    } catch {
      throw new Error('Invalid JSON in AI response')
    }

    const recommendation: AIRecommendation = {
      recommendedAction: parsed.recommendedAction || 'smart-retry',
      recommendedChannel: parsed.recommendedChannel || context.channel,
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.7)),
      riskLevel: parsed.riskLevel || context.risk,
      reasoning: parsed.reasoning || 'AI recommendation',
      alternativeActions: parsed.alternativeActions || [],
      escalationRecommended: parsed.escalationRecommended ?? false,
      source: 'ai-llm',
    }

    // Validate the recommendation
    const validationError = validateRecommendation(recommendation)
    if (validationError) {
      throw new Error(`Invalid AI recommendation: ${validationError}`)
    }

    return recommendation
  }
}

/**
 * Main AI Decision Provider — orchestrates between LLM and fallback.
 * This is the primary interface used by the agent service.
 */
export class AIDecisionProvider {
  private llmProvider: LLMProvider
  private fallbackProvider: DeterministicFallbackProvider

  constructor() {
    this.llmProvider = new LLMProvider()
    this.fallbackProvider = new DeterministicFallbackProvider()
  }

  /**
   * Get a recommendation for the given payment context.
   * Tries LLM first, falls back to deterministic if LLM fails.
   */
  async getRecommendation(context: AIDecisionContext): Promise<AIRecommendation> {
    // Try LLM if available
    if (this.llmProvider.isAvailable()) {
      try {
        const recommendation = await this.llmProvider.getRecommendation(context)
        // Validate before returning
        const validationError = validateRecommendation(recommendation)
        if (!validationError) {
          return recommendation
        }
        // Invalid recommendation — fall through to fallback
      } catch {
        // LLM error — fall through to fallback
      }
    }

    // Use deterministic fallback
    return this.fallbackProvider.getRecommendation(context)
  }

  /**
   * Check if real AI is available (not just fallback).
   */
  isAIAvailable(): boolean {
    return this.llmProvider.isAvailable()
  }

  /**
   * Get the name of the active provider.
   */
  getActiveProviderName(): string {
    if (this.llmProvider.isAvailable()) {
      return this.llmProvider.getProviderName()
    }
    return this.fallbackProvider.getProviderName()
  }
}

// Singleton instance
let aiProvider: AIDecisionProvider | null = null

/**
 * Get the singleton AI Decision Provider instance.
 */
export function getAIDecisionProvider(): AIDecisionProvider {
  if (!aiProvider) {
    aiProvider = new AIDecisionProvider()
  }
  return aiProvider
}