import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

type Scenario = 'standard' | 'high-value' | 'fraud-critical'

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

  const body = await req.json().catch(() => ({}))

  const scenario: Scenario =
    body?.scenario === 'high-value' ||
    body?.scenario === 'fraud-critical'
      ? body.scenario
      : 'standard'

  const scenarios = {
    standard: {
      amount: 49900,
      customerName: 'Demo Customer',
      email: 'demo.customer@example.com',
      contact: '9999999999',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Bank declined the payment',
      orderId: 'order_demo_standard',
    },

    'high-value': {
      amount: 1850000,
      customerName: 'Priya Deshmukh',
      email: 'priya.demo@example.com',
      contact: '9999999998',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Insufficient funds',
      orderId: 'order_demo_high_value',
    },

    'fraud-critical': {
      amount: 315000,
      customerName: 'Divya Reddy',
      email: 'divya.demo@example.com',
      contact: '9999999997',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Fraud suspected by issuer',
      orderId: 'order_demo_fraud',
    },
  }[scenario]

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
          amount: scenario.amount,
          currency: 'INR',
          status: 'failed',
          method: 'card',
          email: scenario.email,
          contact: scenario.contact,
          description: 'RecoverAI Demo Payment',
          order_id: scenario.orderId,
          error_code: scenario.errorCode,
          error_description: scenario.errorDescription,
          notes: {
            customer_name: scenario.customerName,
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
