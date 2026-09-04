'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Webhook,
  Play,
  Loader2,
  IndianRupee,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RazorpayResult = {
  ok: boolean
  status?: string
  eventId?: string
  paymentId?: string
  mode?: string
  realPaymentOperation?: boolean
  policy?: {
    verdict: string
    allowed: boolean
    requiresApproval: boolean
    blocked: boolean
    policyId: string
    reason: string
  }
  error?: string
  reason?: string
}

export function RazorpayIntegrationPanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RazorpayResult | null>(null)

  async function simulateWebhook() {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'demo-signature',
          'X-Razorpay-Event-Id': `evt_demo_${Date.now()}`,
        },
        body: JSON.stringify({
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
        }),
      })

      const data = (await response.json()) as RazorpayResult
      setResult(data)
    } catch (error) {
      setResult({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to simulate Razorpay webhook',
      })
    } finally {
      setLoading(false)
    }
  }

  const processed = result?.status === 'processed'
  const approval = result?.policy?.requiresApproval
  const blocked = result?.policy?.blocked

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="size-4 text-primary" />
          Razorpay Integration
          <Badge variant="success" className="ml-auto">
            Demo Connected
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatusItem
            icon={Webhook}
            label="Webhook"
            value="Ready"
          />

          <StatusItem
            icon={ShieldCheck}
            label="Signature"
            value="Verified"
          />

          <StatusItem
            icon={IndianRupee}
            label="Event"
            value="payment.failed"
          />

          <StatusItem
            icon={ShieldCheck}
            label="Execution"
            value="Dry Run"
          />
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Razorpay Failure Simulation
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                Sends a signed demo payment.failed webhook to RecoverAI.
              </div>
            </div>

            <Badge variant="neutral">No real money movement</Badge>
          </div>

          <Button
            type="button"
            onClick={() => void simulateWebhook()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}

            {loading
              ? 'Processing Webhook...'
              : 'Simulate Razorpay Payment Failure'}
          </Button>
        </div>

        {result && (
          <div
            className={cn(
              'rounded-xl border p-4',
              result.ok && !blocked
                ? 'border-success/25 bg-success-muted/20'
                : 'border-danger/25 bg-danger-muted/20',
            )}
          >
            <div className="flex items-center gap-2">
              {blocked ? (
                <ShieldAlert className="size-4 text-danger" />
              ) : processed ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : (
                <ShieldAlert className="size-4 text-danger" />
              )}

              <span className="text-sm font-semibold">
                {processed
                  ? 'Razorpay Webhook Processed'
                  : result.status === 'ignored'
                    ? 'Webhook Ignored'
                    : result.error ?? 'Webhook Failed'}
              </span>
            </div>

            {processed && result.policy && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ResultItem
                  label="Payment"
                  value={result.paymentId ?? '—'}
                />

                <ResultItem
                  label="Policy"
                  value={result.policy.policyId}
                />

                <ResultItem
                  label="Decision"
                  value={
                    blocked
                      ? 'Blocked'
                      : approval
                        ? 'Human Approval'
                        : 'Allowed'
                  }
                />

                <ResultItem
                  label="Mode"
                  value={result.mode ?? 'dry-run'}
                />
              </div>
            )}

            {processed && result.policy?.reason && (
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Policy reason:
                </span>{' '}
                {result.policy.reason}
              </div>
            )}

            {result.reason && (
              <div className="mt-2 text-xs text-muted-foreground">
                {result.reason}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-success" />
        <span className="text-[10px] font-medium uppercase text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="mt-1 text-xs font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}

function ResultItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 text-xs font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}