import { PageContainer } from '@/components/foundation/page-container'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RiskBadge } from '@/components/ui/status-badge'
import { ApprovalActions, ApprovalPendingCount } from '@/components/approvals/approval-actions'
import { formatCompactCurrency } from '@/lib/format'
import { listApprovals } from '@/services/approval-service'

export default async function ApprovalsPage() {
  const approvals = await listApprovals()

  return (
    <PageContainer>
      <SectionHeader
        title="Approvals"
        description="Actions the agent has queued for human sign-off because they exceed policy thresholds."
        actions={<ApprovalPendingCount />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>Most recently requested first. Approve or reject directly from this queue.</CardDescription>
        </CardHeader>
        <PreviewTable columns={['Payment', 'Amount', 'Risk', 'Reason', 'Requested by', 'Status & actions']}>
          {approvals.map((approval) => (
            <PreviewRow key={approval.id}>
              <PreviewCell className="font-mono text-xs text-muted-foreground">{approval.paymentId}</PreviewCell>
              <PreviewCell className="tabular-nums">{formatCompactCurrency(approval.amount)}</PreviewCell>
              <PreviewCell>
                <RiskBadge risk={approval.riskLevel} />
              </PreviewCell>
              <PreviewCell className="max-w-xs text-muted-foreground">{approval.reason}</PreviewCell>
              <PreviewCell className="capitalize text-muted-foreground">
                {approval.requestedBy.replace('-', ' ')}
              </PreviewCell>
              <PreviewCell>
                <ApprovalActions approvalId={approval.id} />
              </PreviewCell>
            </PreviewRow>
          ))}
        </PreviewTable>
      </Card>
    </PageContainer>
  )
}
