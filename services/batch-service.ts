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
