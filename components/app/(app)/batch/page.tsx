import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { formatCompactCurrency } from '@/lib/format'
import { batchStatusKey } from '@/lib/status'
import { listBatches } from '@/services/batch-service'
import { listStrategies } from '@/services/recovery-service'

export default async function BatchPage() {
  const [batches, strategies] = await Promise.all([listBatches(), listStrategies()])
  const strategyName = (id: string) => strategies.find((s) => s.id === id)?.name ?? id

  return (
    <PageContainer>
      <SectionHeader
        title="Batch Recovery"
        description="Bulk recovery campaigns that apply a strategy across many payments at once."
        actions={<Badge variant="neutral">{batches.length} campaigns</Badge>}
      />

      <div className="grid grid-cols-1 gap-4">
        {batches.map((batch) => {
          const status = batchStatusKey(batch.status)
          return (
            <Card key={batch.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1">
                  <CardTitle>{batch.name}</CardTitle>
                  <CardDescription>Strategy: {strategyName(batch.strategyId)}</CardDescription>
                </div>
                <StatusBadge status={status.key} label={status.label} className="shrink-0" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Payments </span>
                    <span className="font-medium tabular-nums text-foreground">{batch.paymentCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total value </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCompactCurrency(batch.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recovered so far </span>
                    <span className="font-medium tabular-nums text-success">
                      {formatCompactCurrency(batch.recoveredAmount)}
                    </span>
                  </div>
                </div>
                <ProbabilityBar value={batch.progress} />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </PageContainer>
  )
}
