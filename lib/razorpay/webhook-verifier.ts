import crypto from 'crypto'

export interface WebhookVerificationResult {
  valid: boolean
  reason?: string
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | undefined,
): WebhookVerificationResult {
  if (!secret) {
    return {
      valid: false,
      reason: 'RAZORPAY_WEBHOOK_SECRET is not configured on server',
    }
  }

  if (!signature) {
    return {
      valid: false,
      reason: 'Missing X-Razorpay-Signature header',
    }
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    const signatureBuffer = Buffer.from(signature, 'utf8')
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

    if (signatureBuffer.length !== expectedBuffer.length) {
      return {
        valid: false,
        reason: 'Signature length mismatch',
      }
    }

    const match = crypto.timingSafeEqual(
      signatureBuffer,
      expectedBuffer,
    )

    return {
      valid: match,
      reason: match ? undefined : 'Signature mismatch',
    }
  } catch (err) {
    return {
      valid: false,
      reason:
        err instanceof Error
          ? err.message
          : 'Cryptographic verification failure',
    }
  }
}