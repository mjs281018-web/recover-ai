import { PageContainer } from '@/components/foundation/page-container'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/ui/status-badge'
import { formatCompactCurrency } from '@/lib/format'
import { listCustomers } from '@/services/customer-service'

export default async function CustomersPage() {
  const customers = await listCustomers()

  return (
    <PageContainer>
      <SectionHeader
        title="Customers"
        description="Customer accounts, active mandates, and recovery history behind every payment."
        actions={<Badge variant="neutral">{customers.length} accounts</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>All customers</CardTitle>
          <CardDescription>Sorted by lifetime value.</CardDescription>
        </CardHeader>
        <PreviewTable columns={['Customer', 'Segment', 'Lifetime value', 'Active mandates', 'Recovered', 'Failed', 'Risk profile']}>
          {customers.map((customer) => (
            <PreviewRow key={customer.id}>
              <PreviewCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{customer.name}</span>
                  <span className="text-xs text-muted-foreground">{customer.email}</span>
                </div>
              </PreviewCell>
              <PreviewCell className="capitalize text-muted-foreground">{customer.segment}</PreviewCell>
              <PreviewCell className="tabular-nums">{formatCompactCurrency(customer.lifetimeValue)}</PreviewCell>
              <PreviewCell className="tabular-nums">{customer.activeMandates}</PreviewCell>
              <PreviewCell className="tabular-nums text-success">{customer.recoveredCount}</PreviewCell>
              <PreviewCell className="tabular-nums text-danger">{customer.failedCount}</PreviewCell>
              <PreviewCell>
                <RiskBadge risk={customer.riskProfile} />
              </PreviewCell>
            </PreviewRow>
          ))}
        </PreviewTable>
      </Card>
    </PageContainer>
  )
}
