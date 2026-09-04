import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay/webhook-verifier'
import {
  mapRazorpayEventToPayment,
  type RazorpayWebhookPayload,
} from '@/lib/razorpay/mapper'
import { evaluatePolicy } from '@/services/policy-service'
import { recordAuditEvent } from '@/services/audit-service'
import { notifyRuntimeChange } from '@/lib/runtime-events'

const processedEventIds = new Set<string>()
const MAX_IDEMPOTENCY_KEYS = 500

export async function POST(req: NextRequest) {
  try {
    // Razorpay signature must be verified against the exact raw body.
    const rawBody = await req.text()

    const signature = req.headers.get('x-razorpay-signature')
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET

    const verification = verifyRazorpayWebhookSignature(
      rawBody,
      signature,
      secret,
    )

    if (!verification.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid Razorpay webhook signature',
          reason: verification.reason,
        },
        { status: 401 },
      )
    }

    let payload: RazorpayWebhookPayload

    try {
      payload = JSON.parse(rawBody) as RazorpayWebhookPayload
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON payload',
        },
        { status: 400 },
      )
    }

    const eventId =
      req.headers.get('x-razorpay-event-id') ||
      `EVT-${Date.now()}`

    // Demo-safe idempotency protection.
    if (processedEventIds.has(eventId)) {
      return NextResponse.json({
        ok: true,
        status: 'duplicate',
        eventId,
      })
    }

    if (processedEventIds.size >= MAX_IDEMPOTENCY_KEYS) {
      const oldest = processedEventIds.values().next().value

      if (oldest) {
        processedEventIds.delete(oldest)
      }
    }

    processedEventIds.add(eventId)

    // RecoverAI currently handles failed-payment webhooks only.
    if (payload.event !== 'payment.failed') {
      return NextResponse.json({
        ok: true,
        status: 'ignored',
        event: payload.event,
        eventId,
      })
    }

    const payment = mapRazorpayEventToPayment(
      payload,
      eventId,
    )

    if (!payment) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unable to map Razorpay payment payload',
          eventId,
        },
        { status: 400 },
      )
    }

    // Policy is authoritative. No real Razorpay payment operation
    // is performed by this webhook.
    const evaluation = await evaluatePolicy(
      payment,
      payment.recommendedAction,
    )

    await recordAuditEvent({
      id: `AUD-RZP-${eventId}`,
      actor: 'system',
      action: 'razorpay-webhook-received',
      target: payment.id,
      timestamp: new Date().toISOString(),
      status:
        evaluation.verdict === 'blocked'
          ? 'blocked'
          : 'info',
    })

    notifyRuntimeChange(
      'payment-updated',
      payment.id,
    )

    return NextResponse.json({
      ok: true,
      status: 'processed',
      eventId,
      paymentId: payment.id,
      policy: {
        verdict: evaluation.verdict,
        allowed: evaluation.allowed,
        requiresApproval: evaluation.requiresApproval,
        blocked: evaluation.blocked,
        policyId: evaluation.policyId,
        reason: evaluation.reason,
      },
      mode: 'dry-run',
      realPaymentOperation: false,
    })
  } catch (error) {
    console.error(
      'Razorpay webhook processing error:',
      error,
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Webhook processing failed',
      },
      { status: 500 },
    )
  }
}