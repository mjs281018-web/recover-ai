/**
 * Batch service — bulk recovery campaigns grouped by strategy. Wraps the
 * synthetic demo dataset for the foundation phase.
 */
import type { Batch } from '@/types'
import { demoBatches } from '@/data/demo'

export async function listBatches(): Promise<Batch[]> {
  return [...demoBatches].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}

export async function getBatch(batchId: string): Promise<Batch | undefined> {
  return demoBatches.find((b) => b.id === batchId)
}

export async function getBatchMetrics() {
  const totalCampaigns = demoBatches.length
  const totalPayments = demoBatches.reduce((sum, batch) => sum + batch.paymentCount, 0)
  const totalAmount = demoBatches.reduce((sum, batch) => sum + batch.totalAmount, 0)
  const recoveredAmount = demoBatches.reduce((sum, batch) => sum + batch.recoveredAmount, 0)

  const pendingAmount = totalAmount - recoveredAmount
  const recoveryRate = totalAmount === 0 ? 0 : (recoveredAmount / totalAmount) * 100

  const completed = demoBatches.filter((batch) => batch.status === 'completed').length
  const running = demoBatches.filter((batch) => batch.status === 'running').length
  const scheduled = demoBatches.filter((batch) => batch.status === 'scheduled').length
  const paused = demoBatches.filter((batch) => batch.status === 'paused').length

  return {
    totalCampaigns,
    totalPayments,
    totalAmount,
    recoveredAmount,
    pendingAmount,
    recoveryRate,
    completed,
    running,
    scheduled,
    paused,
  }
}
