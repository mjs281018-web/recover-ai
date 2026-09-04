/**
 * Fetch-based LLM provider for RecoverAI.
 *
 * Calls the /api/ai/recommend route (server-side only). Never exposes API keys
 * to the client. Handles timeout, 404, invalid JSON, and schema errors with
 * typed errors that the recommendation service converts to deterministic fallback.
 */
import type { AIConfig, AIRecommendation, AIRecommendationContext } from './ai-types'

export class LLMProviderError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'LLMProviderError'
  }
}

/**
 * Calls the AI recommendation API route.
 * All inputs come from the existing demo store — no fabricated data.
 */
export async function fetchLLMRecommendation(
  context: AIRecommendationContext,
  config: AIConfig,
): Promise<AIRecommendation> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch('/api/ai/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(context),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new LLMProviderError(
        `AI route returned ${response.status}: ${response.statusText}`,
        'AI_ROUTE_ERROR',
      )
    }

    const data = await response.json()

    if (!data || typeof data !== 'object' || !data.recommendation) {
      throw new LLMProviderError('Invalid response format from AI route', 'INVALID_RESPONSE')
    }

    return data.recommendation as AIRecommendation
  } catch (err) {
    if (err instanceof LLMProviderError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new LLMProviderError('AI request timed out', 'TIMEOUT')
    }
    throw new LLMProviderError(
      err instanceof Error ? err.message : 'Unknown AI error',
      'UNKNOWN',
    )
  } finally {
    clearTimeout(timeout)
  }
}