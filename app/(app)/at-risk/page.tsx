import { PageContainer } from '@/components/foundation/page-container'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { Badge } from '@/components/ui/badge'
import { TriangleAlert as AlertTriangle } from 'lucide-react'
import { formatCompactCurrency } from '@/lib/format'
import { paymentStatusKey } from '@/lib/status'
import { listAtRiskPayments } from '@/services/payment-service'
import { FAILURE_REASON_LABELS, RECOVERY_ACTION_LABELS } from '@/types'

export default async function AtRiskPage() {
  const payments = await listAtRiskPayments()

  return (
    <PageContainer>
      <SectionHeader
        title="At-Risk Payments"
        description="Payments the model predicts are likely to fail, ranked by risk, with the agent's recommended next action."
        actions={<Badge variant="danger">{payments.length} flagged</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Predicted failures</CardTitle>
          <CardDescription>At-risk and pending-approval payments from the synthetic dataset.</CardDescription>
        </CardHeader>
        {payments.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No at-risk payments"
            description="Nothing is currently flagged as at risk in the synthetic dataset."
            className="m-5"
          />
        ) : (
          <PreviewTable columns={['Payment', 'Customer', 'Amount', 'Risk', 'Probability', 'Failure reason', 'Recommended action', 'Status']}>
            {payments.map((payment) => (
              <PreviewRow key={payment.id}>
                <PreviewCell className="font-mono text-xs text-muted-foreground">{payment.id}</PreviewCell>
                <PreviewCell>{payment.customerName}</PreviewCell>
                <PreviewCell className="tabular-nums">{formatCompactCurrency(payment.amount)}</PreviewCell>
                <PreviewCell>
                  <RiskBadge risk={payment.risk} />
                </PreviewCell>
                <PreviewCell className="w-40">
                  <ProbabilityBar value={payment.recoveryProbability} />
                </PreviewCell>
                <PreviewCell className="text-muted-foreground">
                  {payment.failureReason ? FAILURE_REASON_LABELS[payment.failureReason] : '—'}
                </PreviewCell>
                <PreviewCell className="text-muted-foreground">
                  {RECOVERY_ACTION_LABELS[payment.recommendedAction]}
                </PreviewCell>
                <PreviewCell>
                  <StatusBadge status={paymentStatusKey(payment.status)} />
                </PreviewCell>
              </PreviewRow>
            ))}
          </PreviewTable>
        )}
      </Card>
    </PageContainer>
  )
}
