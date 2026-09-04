import { NextResponse } from 'next/server'
import type { AIRecommendation, AIRecommendationContext } from '@/lib/ai/ai-types'

/**
 * AI Recommendation API Route — server-side only.
 *
 * Receives payment context from the AI recommendation service, builds a prompt,
 * calls an OpenAI-compatible LLM, validates the response, and returns a
 * structured recommendation. The Policy Engine remains authoritative: this
 * route only provides input to policy, never overrides it.
 */

const LLM_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
}

function buildPrompt(context: AIRecommendationContext): string {
  const previousAttempts = context.previousOutcomes.length
  const failedChannels = context.failedStrategyChannels.join(', ') || 'none'

  return `You are an AI payment recovery assistant for Razorpay. Analyze the failed payment and recommend the optimal recovery strategy.

## Payment Details
- Amount: ₹${context.amount.toLocaleString('en-IN')}
- Channel: ${context.channel}
- Failure Reason: ${context.failureReason || 'unknown'}
- Customer Segment: ${context.segment}
- Risk Level: ${context.risk}
- Recovery Probability: ${(context.recoveryProbability * 100).toFixed(1)}%
- Previous Attempts: ${previousAttempts}
- Failed Channels: ${failedChannels}
- Prior Failure: ${context.hasPriorFailure ? 'yes' : 'no'}

## Recovery Actions Available
- retry: Simple retry on same channel
- smart-retry: Intelligent retry with timing optimization
- switch-channel: Move to different payment channel
- send-reminder: Notify customer to retry
- update-payment-method: Request new payment details
- hold: Temporarily pause recovery
- human-approval: Escalate to human agent

## Available Channels
- upi, card, netbanking, wallet, mandate

## Important Safety Rules
- NEVER recommend action on fraud-suspected or card-lost payments
- NEVER recommend more than 4 retry attempts
- NEVER recommend switch-channel for mandate payments
- ALWAYS escalate high-risk enterprise payments above ₹50,000
- ALWAYS require human approval for payments above ₹10,000 with medium+ risk

## Previous Outcomes
${context.previousOutcomes.map((o, i) => `${i + 1}. ${o.action} via ${o.channel} -> ${o.result}`).join('\n') || 'No previous outcomes'}

Respond with ONLY a valid JSON object in this exact format:
{
  "recommendedAction": "retry|smart-retry|switch-channel|send-reminder|update-payment-method|hold|human-approval",
  "recommendedChannel": "upi|card|netbanking|wallet|mandate",
  "reasoning": "Clear explanation of why this action was chosen",
  "confidence": 0.85,
  "riskLevel": "low|medium|high|critical",
  "alternativeActions": ["action1", "action2"],
  "escalationRecommended": false
}`
}

function validateRecommendation(data: unknown): AIRecommendation | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  const validActions = ['retry', 'smart-retry', 'switch-channel', 'send-reminder', 'update-payment-method', 'hold', 'human-approval']
  const validChannels = ['upi', 'card', 'netbanking', 'wallet', 'mandate']
  const validRiskLevels = ['low', 'medium', 'high', 'critical']

  if (typeof d.recommendedAction !== 'string' || !validActions.includes(d.recommendedAction)) return null
  if (typeof d.recommendedChannel !== 'string' || !validChannels.includes(d.recommendedChannel)) return null
  if (typeof d.reasoning !== 'string') return null
  if (typeof d.confidence !== 'number' || d.confidence < 0 || d.confidence > 1) return null
  if (typeof d.riskLevel !== 'string' || !validRiskLevels.includes(d.riskLevel)) return null
  if (!Array.isArray(d.alternativeActions)) return null
  if (typeof d.escalationRecommended !== 'boolean') return null

  return {
    recommendedAction: d.recommendedAction as AIRecommendation['recommendedAction'],
    recommendedChannel: d.recommendedChannel as AIRecommendation['recommendedChannel'],
    reasoning: d.reasoning,
    confidence: d.confidence,
    riskLevel: d.riskLevel as AIRecommendation['riskLevel'],
    alternativeActions: d.alternativeActions as AIRecommendation['alternativeActions'],
    escalationRecommended: d.escalationRecommended,
    status: {
      usedAI: true,
      source: 'ai-llm',
      provider: 'openai',
      model: 'gpt-4o-mini',
      latencyMs: 0,
    },
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    const context: AIRecommendationContext = await request.json()

    // Provider credentials and model selection are read only by this server route.
    const provider = process.env.AI_PROVIDER || 'openai'
    const model = process.env.AI_MODEL || 'gpt-4o-mini'
    const apiKey = process.env.AI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI_API_KEY not configured', recommendation: null },
        { status: 401 },
      )
    }

    const endpoint = LLM_ENDPOINTS[provider] || LLM_ENDPOINTS.openai
    const prompt = buildPrompt(context)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert payment recovery AI. Always respond with valid JSON only. Never include markdown or explanations outside the JSON object.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `LLM API error: ${response.status}`, recommendation: null },
        { status: 502 },
      )
    }

    const llmData = await response.json()
    const content = llmData.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No content in LLM response', recommendation: null },
        { status: 502 },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON from LLM', recommendation: null },
        { status: 502 },
      )
    }

    const recommendation = validateRecommendation(parsed)

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation failed validation', recommendation: null },
        { status: 502 },
      )
    }

    recommendation.status.latencyMs = Date.now() - startTime
    recommendation.status.provider = provider
    recommendation.status.model = model

    return NextResponse.json({ recommendation })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error', recommendation: null },
      { status: 500 },
    )
  }
}