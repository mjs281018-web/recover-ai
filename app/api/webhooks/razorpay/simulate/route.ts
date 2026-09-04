import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'RAZORPAY_WEBHOOK_SECRET is not configured',
      },
      { status: 500 },
    )
  }

  const eventId = `evt_demo_${Date.now()}`

  const payload = {
    entity: 'event',
    account_id: 'acc_demo',
    event: 'payment.failed',
    contains: ['payment'],
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: `pay_demo_${Date.now()}`,
          amount: 49900,
          currency: 'INR',
          status: 'failed',
          method: 'card',
          email: 'demo.customer@example.com',
          contact: '9999999999',
          description: 'RecoverAI Demo Payment',
          order_id: 'order_demo_001',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Bank declined the payment',
          notes: {
            customer_name: 'Demo Customer',
          },
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
  }

  const rawBody = JSON.stringify(payload)

  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  const webhookUrl = new URL(
    '/api/webhooks/razorpay',
    req.url,
  )

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Razorpay-Signature': signature,
      'X-Razorpay-Event-Id': eventId,
    },
    body: rawBody,
  })

  const data = await response.json()

  return NextResponse.json(data, {
    status: response.status,
  })
}
