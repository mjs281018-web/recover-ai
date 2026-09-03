import { BatchOverview } from '@/components/batch/batch-overview'
import { getBatchMetrics, listBatches } from '@/services/batch-service'
import { listStrategies } from '@/services/recovery-service'

export default async function BatchPage() {
  const [batches, strategies, metrics] = await Promise.all([
    listBatches(),
    listStrategies(),
    getBatchMetrics(),
  ])

  return <BatchOverview initialBatches={batches} initialStrategies={strategies} initialMetrics={metrics} />
}