import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCompactCurrency } from '@/lib/format'
import { listCustomers } from '@/services/customer-service'
import { CustomerList } from '@/components/customers/customer-list'

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
        <CustomerList customers={customers} />
      </Card>
    </PageContainer>
  )
}