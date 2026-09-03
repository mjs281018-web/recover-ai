'use client'

import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/foundation/page-container'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { Badge } from '@/components/ui/badge'
import { formatCompactCurrency } from '@/lib/format'
import { paymentStatusKey, recoveryActionStatusKey } from '@/lib/status'
import { listPayments } from '@/services/payment-service'
import { listRecoveryActions } from '@/services/recovery-service'
import { useRuntimeEvents } from '@/lib/use-runtime-events'
import { RECOVERY_ACTION_LABELS } from '@/types'
import type { Payment, RecoveryAction } from '@/types'

/**
 * Live Revenue Recovery view. Re-reads recovered / in-progress payments and the
 * full recovery-action log from the shared in-memory store whenever a runtime
 * event fires, so every retry, approval or batch run shows up here.
 */
export function RecoveryFlow({
  initialPayments,
  initialActions,
}: {
  initialPayments: Payment[]
  initialActions: RecoveryAction[]
}) {
  const event = useRuntimeEvents()
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [actions, setActions] = useState<RecoveryAction[]>(initialActions)

  useEffect(() => {
    let active = true
    void Promise.all([
      listPayments({ status: ['in-progress', 'recovered'] }),
      listRecoveryActions(),
    ]).then(([nextPayments, nextActions]) => {
      if (!active) return
      setPayments(nextPayments)
      setActions(nextActions)
    })
    return () => {
      active = false
    }
  }, [event])

  return (
    <PageContainer>
      <SectionHeader
        title="Revenue Recovery"
        description="Payments the recovery engine has recovered or is actively working, and the actions behind each attempt."
        actions={<Badge variant="warning">Demo data</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recovered & in-progress payments</CardTitle>
          <CardDescription>Synthetic transactions currently being retried or already recovered.</CardDescription>
        </CardHeader>
        <PreviewTable columns={['Payment', 'Customer', 'Amount', 'Channel', 'Probability', 'Status']}>
          {payments.map((payment) => (
            <PreviewRow key={payment.id}>
              <PreviewCell className="font-mono text-xs text-muted-foreground">{payment.id}</PreviewCell>
              <PreviewCell>{payment.customerName}</PreviewCell>
              <PreviewCell className="tabular-nums">{formatCompactCurrency(payment.amount)}</PreviewCell>
              <PreviewCell className="capitalize text-muted-foreground">{payment.channel}</PreviewCell>
              <PreviewCell className="w-40">
                <ProbabilityBar value={payment.recoveryProbability} />
              </PreviewCell>
              <PreviewCell>
                <StatusBadge status={paymentStatusKey(payment.status)} />
              </PreviewCell>
            </PreviewRow>
          ))}
        </PreviewTable>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recovery actions</CardTitle>
          <CardDescription>
            Every retry, reminder, and escalation the engine has queued or run — this is the attempt
            history behind the recovered payments.
          </CardDescription>
        </CardHeader>
        <PreviewTable columns={['Payment', 'Action', 'Channel', 'Initiated by', 'Status']}>
          {actions.map((action) => {
            const status = recoveryActionStatusKey(action.status)
            return (
              <PreviewRow key={action.id}>
                <PreviewCell className="font-mono text-xs text-muted-foreground">{action.paymentId}</PreviewCell>
                <PreviewCell>{RECOVERY_ACTION_LABELS[action.type]}</PreviewCell>
                <PreviewCell className="uppercase text-muted-foreground">{action.channel}</PreviewCell>
                <PreviewCell className="capitalize text-muted-foreground">
                  {action.initiatedBy.replace('-', ' ')}
                </PreviewCell>
                <PreviewCell>
                  <StatusBadge status={status.key} label={status.label} />
                </PreviewCell>
              </PreviewRow>
            )
          })}
        </PreviewTable>
      </Card>
    </PageContainer>
  )
}