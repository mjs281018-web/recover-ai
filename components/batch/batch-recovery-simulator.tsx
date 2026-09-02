'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { formatCompactCurrency } from '@/lib/format'
import {
  simulateBatchRecovery,
  type BatchSimulationResult,
} from '@/services/batch-service'
import type { Batch } from '@/types'

interface BatchRecoverySimulatorProps {
  batch: Batch
}

const stageNames = [
  'Observe',
  'Analyze',
  'Predict',
  'Decide',
  'Policy Check',
  'Act',
  'Verify',
  'Audit',
]

export function BatchRecoverySimulator({
  batch,
}: BatchRecoverySimulatorProps) {
  const [running, setRunning] = useState(false)
  const [completedStages, setCompletedStages] = useState(0)
  const [result, setResult] = useState<BatchSimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runSimulation = async () => {
    setRunning(true)
    setCompletedStages(0)
    setResult(null)
    setError(null)

    try {
      const simulation = await simulateBatchRecovery(batch.id)

      if (!simulation) {
        setError('Batch could not be found.')
        setRunning(false)
        return
      }

      for (let index = 0; index < stageNames.length; index += 1) {
        await new Promise((resolve) => setTimeout(resolve, 450))
        setCompletedStages(index + 1)
      }

      setResult(simulation)
    } catch {
      setError('Recovery simulation failed. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  const progress = (completedStages / stageNames.length) * 100

  return (
    <Card className="border-dashed">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">
              Recovery simulation
            </CardTitle>

            <CardDescription>
              Run the bounded AI recovery workflow for this batch.
            </CardDescription>
          </div>

          <button
            type="button"
            onClick={runSimulation}
            disabled={running}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? 'Running recovery…' : '▶ Run Recovery'}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Running pipeline */}
        {running && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Recovery pipeline
              </span>

              <span className="font-medium tabular-nums">
                {completedStages}/{stageNames.length}
              </span>
            </div>

            <ProbabilityBar value={progress / 100} />

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {stageNames.map((stage, index) => {
                const completed = index < completedStages

                return (
                  <div
                    key={stage}
                    className={`rounded-md border px-3 py-2 text-xs ${
                      completed
                        ? 'border-success/40 bg-success/5 text-success'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{completed ? '✓' : '○'}</span>
                      <span>{stage}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Simulation result */}
        {result && !running && (
          <div className="space-y-5">
            {/* Result status */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                Simulation completed
              </Badge>

              <Badge variant="neutral">
                {result.paymentsProcessed} payments processed
              </Badge>

              {result.escalatedPayments > 0 && (
                <Badge variant="warning">
                  {result.escalatedPayments} human escalation
                  {result.escalatedPayments === 1 ? '' : 's'}
                </Badge>
              )}

              {result.stoppedPayments > 0 && (
                <Badge variant="danger">
                  {result.stoppedPayments} stopped
                </Badge>
              )}
            </div>
            {/* Before / After Recovery Impact */}
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">
                  Recovery impact
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  Measured revenue impact before and after the AI recovery workflow.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* BEFORE */}
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium">
                      Before recovery
                    </div>

                    <Badge variant="outline">
                      At risk
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Revenue at risk
                      </div>

                      <div className="mt-1 text-lg font-semibold tabular-nums">
                        {formatCompactCurrency(result.totalAmount)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Payments requiring recovery
                      </div>

                      <div className="mt-1 font-medium tabular-nums">
                        {result.paymentsProcessed}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Recoverable amount
                      </div>

                      <div className="mt-1 font-medium tabular-nums">
                        {formatCompactCurrency(result.totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium">
                      AI recovery action
                    </div>

                    <Badge variant="ai">
                      Executed
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Recovery attempts
                      </div>

                      <div className="mt-1 font-medium tabular-nums">
                        {result.recoveryAttempts}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Human escalations
                      </div>

                      <div className="mt-1 font-medium tabular-nums">
                        {result.escalatedPayments}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Stopped by controls
                      </div>

                      <div className="mt-1 font-medium tabular-nums">
                        {result.stoppedPayments}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AFTER */}
                <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium">
                      After recovery
                    </div>

                    <Badge variant="success">
                      Measured
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Revenue recovered
                      </div>

                      <div className="mt-1 text-lg font-semibold tabular-nums text-success">
                        {formatCompactCurrency(result.recoveredAmount)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Successful recoveries
                      </div>

                      <div className="mt-1 font-medium tabular-nums">
                        {result.recoveredPayments}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Remaining at risk
                      </div>

                      <div className="mt-1 font-medium tabular-nums">
                        {formatCompactCurrency(result.pendingAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recovery uplift */}
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      Recovery uplift
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Revenue recovered as a share of the value that was at risk.
                    </div>
                  </div>

                  <div className="text-2xl font-semibold tabular-nums text-success">
                    {result.recoveryRate.toFixed(1)}%
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{
                      width: `${Math.min(100, result.recoveryRate)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Before: {formatCompactCurrency(result.totalAmount)}
                  </span>

                  <span>
                    After: {formatCompactCurrency(result.recoveredAmount)}
                  </span>
                </div>
              </div>
            </div>
            {/* Main recovery metrics */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">
                  Recovered revenue
                </div>

                <div className="mt-1 text-lg font-semibold tabular-nums text-success">
                  {formatCompactCurrency(result.recoveredAmount)}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">
                  Recovery rate
                </div>

                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {result.recoveryRate.toFixed(1)}%
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">
                  Recovery attempts
                </div>

                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {result.recoveryAttempts}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">
                  Pending value
                </div>

                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {formatCompactCurrency(result.pendingAmount)}
                </div>
              </div>
            </div>

            {/* Payment outcomes */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Recovered payments
                </div>

                <div className="font-medium tabular-nums">
                  {result.recoveredPayments}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">
                  Failed
                </div>

                <div className="font-medium tabular-nums">
                  {result.failedPayments}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">
                  Escalated
                </div>

                <div className="font-medium tabular-nums">
                  {result.escalatedPayments}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">
                  Stopped
                </div>

                <div className="font-medium tabular-nums">
                  {result.stoppedPayments}
                </div>
              </div>
            </div>

            {/* Recovery controls */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-3 text-sm font-medium">
                Recovery controls
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                <div>
                  ✓ Policy checks applied
                </div>

                <div>
                  ✓ Bounded recovery actions
                </div>

                <div>
                  ✓ Failed actions stopped
                </div>

                {result.escalatedPayments > 0 && (
                  <div className="font-medium text-warning">
                    ⚠ {result.escalatedPayments} payment
                    {result.escalatedPayments === 1 ? '' : 's'} escalated
                    for human review
                  </div>
                )}

                {result.stoppedPayments > 0 && (
                  <div className="font-medium text-destructive">
                    ⛔ {result.stoppedPayments} payment
                    {result.stoppedPayments === 1 ? '' : 's'} stopped
                    by recovery controls
                  </div>
                )}
              </div>
            </div>

            {/* Human escalation */}
            {result.escalatedPayments > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <div className="mb-2 text-sm font-medium">
                  Human escalation required
                </div>

                <div className="text-xs text-muted-foreground">
                  {result.escalatedPayments} high-risk payment
                  {result.escalatedPayments === 1 ? '' : 's'} were
                  routed to human review before recovery could continue.
                </div>

                <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">
                      Trigger
                    </span>

                    <div className="font-medium">
                      High-value / high-risk
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      Action
                    </span>

                    <div className="font-medium">
                      Human review
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      Control
                    </span>

                    <div className="font-medium">
                      No unbounded retry
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stopping rules */}
            {result.stoppedPayments > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="mb-2 text-sm font-medium">
                  Stopping rules triggered
                </div>

                <div className="text-xs text-muted-foreground">
                  Recovery stopped for {result.stoppedPayments} payment
                  {result.stoppedPayments === 1 ? '' : 's'} to prevent
                  further automated actions.
                </div>

                <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">
                      Retry limit
                    </span>

                    <div className="font-medium">
                      Enforced
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      Policy failure
                    </span>

                    <div className="font-medium">
                      Stop action
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      Further retry
                    </span>

                    <div className="font-medium">
                      Blocked
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audit trail */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-3 text-sm font-medium">
                Audit trail
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                <div>
                  Batch:{' '}
                  <span className="text-foreground">
                    {batch.id}
                  </span>
                </div>

                <div>
                  Payments processed:{' '}
                  <span className="text-foreground">
                    {result.paymentsProcessed}
                  </span>
                </div>

                <div>
                  Actions attempted:{' '}
                  <span className="text-foreground">
                    {result.recoveryAttempts}
                  </span>
                </div>

                <div>
                  Revenue recovered:{' '}
                  <span className="text-success">
                    {formatCompactCurrency(result.recoveredAmount)}
                  </span>
                </div>

                <div>
                  Human escalations:{' '}
                  <span className="font-medium text-warning">
                    {result.escalatedPayments}
                  </span>
                </div>

                <div>
                  Stopped by controls:{' '}
                  <span className="font-medium text-destructive">
                    {result.stoppedPayments}
                  </span>
                </div>

                <div>
                  Pending value:{' '}
                  <span className="text-foreground">
                    {formatCompactCurrency(result.pendingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}