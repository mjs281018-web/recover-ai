import { PageContainer } from '@/components/foundation/page-container'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge'
import { formatCompactCurrency } from '@/lib/format'
import { approvalStatusKey } from '@/lib/status'
import { listApprovals } from '@/services/approval-service'

export default async function ApprovalsPage() {
  const approvals = await listApprovals()
  const pending = approvals.filter((a) => a.status === 'pending').length

  return (
    <PageContainer>
      <SectionHeader
        title="Approvals"
        description="Actions the agent has queued for human sign-off because they exceed policy thresholds."
        actions={<Badge variant="warning">{pending} pending</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>Most recently requested first.</CardDescription>
        </CardHeader>
        <PreviewTable columns={['Payment', 'Amount', 'Risk', 'Reason', 'Requested by', 'Status']}>
          {approvals.map((approval) => {
            const status = approvalStatusKey(approval.status)
            return (
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
