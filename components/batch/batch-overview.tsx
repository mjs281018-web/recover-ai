
'use client'

import { useEffect, useState } from 'react'
import { BatchRecoverySimulator } from '@/components/batch/batch-recovery-simulator'
import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { formatCompactCurrency } from '@/lib/format'
import { batchStatusKey } from '@/lib/status'
import {
  getBatchMetrics,
  listBatches,
} from '@/services/batch-service'
import { useRuntimeEvents } from '@/lib/use-runtime-events'
import type {
  Batch,
  RecoveryStrategy,
} from '@/types'

/**
 * Live batch recovery view.
 *
 * Recomputes batch list and aggregate metrics whenever
 * a runtime event occurs.
 */
export function BatchOverview({
  initialBatches,
  initialStrategies,
  initialMetrics,
}: {
  initialBatches: Batch[]
  initialStrategies: RecoveryStrategy[]
  initialMetrics: Awaited<
    ReturnType<typeof getBatchMetrics>
  >
}) {
  const event = useRuntimeEvents()

  const [batches, setBatches] =
    useState<Batch[]>(initialBatches)

  const [metrics, setMetrics] =
    useState(initialMetrics)

  useEffect(() => {
    let active = true

    void Promise.all([
      listBatches(),
      getBatchMetrics(),
    ]).then(
      ([nextBatches, nextMetrics]) => {
        if (!active) return

        setBatches(nextBatches)
        setMetrics(nextMetrics)
      },
    )

    return () => {
      active = false
    }
  }, [event])

  const strategyName = (id: string) =>
    initialStrategies.find(
      (strategy) => strategy.id === id,
    )?.name ?? id

  return (
    <PageContainer>
      <SectionHeader
        title="Batch Recovery"
        description="Bulk recovery campaigns that apply a strategy across many payments at once."
        actions={
          <Badge variant="neutral">
            {batches.length} campaigns
          </Badge>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Batch-level recovery metrics                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {/* Total at risk */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Total at risk
            </CardDescription>

            <CardTitle className="text-xl tabular-nums">
              {formatCompactCurrency(
                metrics.totalAmount,
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            {metrics.totalPayments} payments across{' '}
            {metrics.totalCampaigns} campaigns
          </CardContent>
        </Card>

        {/* Recovered */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Recovered
            </CardDescription>

            <CardTitle className="text-xl tabular-nums text-success">
              {formatCompactCurrency(
                metrics.recoveredAmount,
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            Revenue successfully recovered
          </CardContent>
        </Card>

        {/* Recovery rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Recovery rate
            </CardDescription>

            <CardTitle className="text-xl tabular-nums">
              {metrics.recoveryRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            Recovered ÷ total at risk
          </CardContent>
        </Card>

        {/* Pending / at risk */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Pending / at risk
            </CardDescription>

            <CardTitle className="text-xl tabular-nums">
              {formatCompactCurrency(
                metrics.pendingAmount,
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            Remaining unrecovered value
          </CardContent>
        </Card>

        {/* Campaign status */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Campaign status
            </CardDescription>

            <CardTitle className="text-xl tabular-nums">
              {metrics.completed}/
              {metrics.totalCampaigns}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            {metrics.completed} completed ·{' '}
            {metrics.running} running ·{' '}
            {metrics.scheduled} scheduled ·{' '}
            {metrics.paused} paused
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Existing batch campaigns                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-4">
        {batches.map((batch) => {
          const status = batchStatusKey(
            batch.status,
          )

          const recoveryRate =
            batch.totalAmount === 0
              ? 0
              : (batch.recoveredAmount /
                  batch.totalAmount) *
                100

          return (
            <Card key={batch.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1">
                  <CardTitle>
                    {batch.name}
                  </CardTitle>

                  <CardDescription>
                    Strategy:{' '}
                    {strategyName(
                      batch.strategyId,
                    )}
                  </CardDescription>
                </div>

                <StatusBadge
                  status={status.key}
                  label={status.label}
                  className="shrink-0"
                />
              </CardHeader>

              <CardContent className="flex flex-col gap-3 pt-0">
                {/* Campaign metrics */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Payments{' '}
                    </span>

                    <span className="font-medium tabular-nums text-foreground">
                      {batch.paymentCount}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      Total value{' '}
                    </span>

                    <span className="font-medium tabular-nums text-foreground">
                      {formatCompactCurrency(
                        batch.totalAmount,
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      Recovered so far{' '}
                    </span>

                    <span className="font-medium tabular-nums text-success">
                      {formatCompactCurrency(
                        batch.recoveredAmount,
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      Recovery rate{' '}
                    </span>

                    <span className="font-medium tabular-nums text-foreground">
                      {recoveryRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Campaign progress */}
                <ProbabilityBar
                  value={batch.progress}
                />

                {/* Recovery simulator */}
                <BatchRecoverySimulator
                  batch={batch}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </PageContainer>
  )
}

