'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import { paymentStatusKey, recoveryActionStatusKey } from '@/lib/status'
import { FAILURE_REASON_LABELS, RECOVERY_ACTION_LABELS } from '@/types'
import { AGENT_PIPELINE } from '@/lib/recovery-pipeline'
import { useRuntimeEvents } from '@/lib/use-runtime-events'
import { listAtRiskPayments } from '@/services/payment-service'
import {
  decideRecoveryApproval,
  resetRecoveryRun,
  runRecoveryStage,
  type RecoveryStageSnapshot,
} from '@/services/agent-service'
import { listRecoveryActions, listRecoveryOutcomes } from '@/services/recovery-service'
import { evaluatePolicy } from '@/services/policy-service'
import type {
  Approval,
  Payment,
  PolicyEvaluation,
  RecoveryAction,
  RecoveryOutcome,
} from '@/types'

function timeLabel(value: string): string {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString('en-IN', { hour12: false })
}

function verdictBadge(evaluation: PolicyEvaluation) {
  if (evaluation.blocked) {
    return { label: 'Blocked', variant: 'danger' as const, icon: ShieldOff }
  }
  if (evaluation.requiresApproval) {
    return { label: 'Approval required', variant: 'warning' as const, icon: ShieldAlert }
  }
  return { label: 'Allowed', variant: 'success' as const, icon: ShieldCheck }
}

/**
 * Interactive at-risk queue. Selecting a payment shows its real current state,
 * policy verdict, attempt history and outcomes. "Run AI Recovery" executes the
 * actual 8-stage agent pipeline against the shared in-memory store, so a
 * successful run moves the payment to recovered and updates every dashboard.
 * Human approvals can be granted or rejected inline (same service the
 * Approvals page uses).
 */
export function AtRiskWorkbench({ initialPayments }: { initialPayments: Payment[] }) {
  const event = useRuntimeEvents()
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [selectedId, setSelectedId] = useState<string | null>(initialPayments[0]?.id ?? null)
  const [actions, setActions] = useState<RecoveryAction[]>([])
  const [outcomes, setOutcomes] = useState<RecoveryOutcome[]>([])
  const [steps, setSteps] = useState<RecoveryStageSnapshot[]>([])
  const [policy, setPolicy] = useState<PolicyEvaluation | null>(null)
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pause, setPause] = useState<{ nextIndex: number; approval: Approval } | null>(null)

  const selectedRef = useRef(selectedId)
  const collectedRef = useRef<RecoveryStageSnapshot[]>([])

  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  const refresh = useCallback(async () => {
    const next = await listAtRiskPayments()
    setPayments(next)
    const targetId = selectedRef.current
    if (targetId) {
      setActions(await listRecoveryActions(targetId))
      setOutcomes(await listRecoveryOutcomes(targetId))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, event])

  function selectPayment(id: string) {
    selectedRef.current = id
    setSelectedId(id)
    setSteps([])
    setPause(null)
    setNotice(null)
    void listRecoveryActions(id).then(setActions)
    void listRecoveryOutcomes(id).then(setOutcomes)
  }

  const selectedPayment =
    payments.find((p) => p.id === selectedId) ??
    [...steps].reverse().find((s) => s.paymentId === selectedId)?.payment

  useEffect(() => {
    if (!selectedPayment || selectedPayment.status === 'recovered') {
      setPolicy(null)
      return
    }
    let active = true
    void evaluatePolicy(selectedPayment, selectedPayment.recommendedAction).then((result) => {
      if (active) setPolicy(result)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPayment?.id, selectedPayment?.status, event])

  async function runStages(fromIndex: number) {
    const targetId = selectedRef.current
    if (!targetId) return
    const collected = collectedRef.current
    try {
      for (let i = fromIndex; i < AGENT_PIPELINE.length; i++) {
        const stage = AGENT_PIPELINE[i]
        const snapshot = await runRecoveryStage(targetId, stage.key)
        collected[i] = snapshot
        collectedRef.current = [...collected]
        setSteps([...collected])

        if (snapshot.policyEvaluation?.blocked) {
          setNotice(
            `Policy ${snapshot.policyEvaluation.policyId} blocked the action — no retry was executed.`,
          )
          return
        }
        if (snapshot.actResult?.kind === 'awaiting-approval') {
          if (snapshot.approval) {
            setPause({ nextIndex: i, approval: snapshot.approval })
            return
          }
          setNotice('The agent requires human approval, but no approval request exists.')
          return
        }
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err))
      collectedRef.current = [...collected]
      setSteps([...collected])
    }
  }

  async function runRecovery() {
    if (running || !selectedRef.current) return
    setRunning(true)
    setNotice(null)
    setPause(null)
    setSteps([])
    collectedRef.current = []
    try {
      await runStages(0)
    } finally {
      setRunning(false)
      void refresh()
    }
  }

  async function handleApproval(decision: 'approved' | 'rejected') {
    const targetId = selectedRef.current
    if (!pause || !targetId) return
    setRunning(true)
    try {
      await decideRecoveryApproval(targetId, pause.approval.id, decision)
      setPause(null)
      if (decision === 'approved') {
        setNotice(null)
        // Resume at the Act stage so the retry actually executes now that sign-off is granted.
        try {
          await runStages(pause.nextIndex)
        } finally {
          setRunning(false)
        }
      } else {
        setNotice('Approval rejected — recovery halted and the decision was written to the audit trail.')
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
      void refresh()
    }
  }

  async function handleReset() {
    const targetId = selectedRef.current
    if (!targetId || running) return
    setNotice(null)
    setPause(null)
    setSteps([])
    collectedRef.current = []
    await resetRecoveryRun(targetId)
    void refresh()
  }

  const decisionStep = [...steps].reverse().find((s) => s.decision)
  const predictionStep = [...steps].reverse().find((s) => s.prediction)
  const lastPolicyStep = [...steps].reverse().find((s) => s.policyEvaluation)
  const latestPolicy = lastPolicyStep?.policyEvaluation ?? (selectedPayment ? policy : null)

  return (
    <PageContainer className="max-w-[1400px]">
      <SectionHeader
        title="At-Risk Payments"
        description="Payments the model predicts are likely to fail, ranked by risk, with the agent's recommended next action."
        actions={<Badge variant="danger">{payments.length} flagged</Badge>}
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No at-risk payments"
          description="Nothing is currently flagged as at risk in the synthetic dataset."
          className="m-5"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Payment queue */}
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Predicted failures</CardTitle>
              <CardDescription>
                Select a payment to inspect its real state, policy verdict and attempt history.
              </CardDescription>
            </CardHeader>
            <PreviewTable
              columns={[
                'Payment',
                'Customer',
                'Amount',
                'Risk',
                'Probability',
                'Failure reason',
                'Recommended action',
                'Status',
              ]}
            >
              {payments.map((payment) => (
                <PreviewRow
                  key={payment.id}
                  onClick={() => selectPayment(payment.id)}
                  className={cn(selectedId === payment.id && 'bg-primary/5')}
                >
                  <PreviewCell className="font-mono text-xs text-muted-foreground">{payment.id}</PreviewCell>
                  <PreviewCell>{payment.customerName}</PreviewCell>
                  <PreviewCell className="tabular-nums">{formatCompactCurrency(payment.amount)}</PreviewCell>
                  <PreviewCell>
                    <RiskBadge risk={payment.risk} />
                  </PreviewCell>
                  <PreviewCell className="w-40">
                    <ProbabilityBar value={payment.recoveryProbability} />
                  </PreviewCell>
                  <PreviewCell className="text-muted-foreground">
                    {payment.failureReason ? FAILURE_REASON_LABELS[payment.failureReason] : '—'}
                  </PreviewCell>
                  <PreviewCell className="text-muted-foreground">
                    {RECOVERY_ACTION_LABELS[payment.recommendedAction]}
                  </PreviewCell>
                  <PreviewCell>
                    <StatusBadge status={paymentStatusKey(payment.status)} />
                  </PreviewCell>
                </PreviewRow>
              ))}
            </PreviewTable>
          </Card>

          {/* Detail + recovery workbench */}
          {selectedPayment ? (
            <div className="flex flex-col gap-6 xl:col-span-2">
              <Card>
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="font-mono text-base">{selectedPayment.id}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={paymentStatusKey(selectedPayment.status)} />
                      <RiskBadge risk={selectedPayment.risk} />
                    </div>
                  </div>
                  <CardDescription>
                    {selectedPayment.customerName} · {selectedPayment.paymentMethodLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 pt-0 text-sm sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="font-medium tabular-nums">{formatCompactCurrency(selectedPayment.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Channel</div>
                    <div className="font-medium capitalize">{selectedPayment.channel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Attempts</div>
                    <div className="font-medium tabular-nums">{selectedPayment.attempts}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Failure reason</div>
                    <div className="font-medium">
                      {selectedPayment.failureReason
                        ? FAILURE_REASON_LABELS[selectedPayment.failureReason]
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Recommended action</div>
                    <div className="font-medium">
                      {RECOVERY_ACTION_LABELS[selectedPayment.recommendedAction]}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Recovery probability</div>
                    <div className="w-36">
                      <ProbabilityBar value={selectedPayment.recoveryProbability} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">AI confidence</div>
                    <div className="font-medium tabular-nums">
                      {formatPercent(selectedPayment.aiConfidence)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Policy verdict */}
              {latestPolicy && (
                <div className="rounded-lg border border-border bg-surface/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {(() => {
                      const verdict = verdictBadge(latestPolicy)
                      const Icon = verdict.icon
                      return (
                        <>
                          <Badge variant={verdict.variant} className="gap-1">
                            <Icon className="size-3.5" />
                            {verdict.label}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">
                            {latestPolicy.policyId}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {latestPolicy.reason}
                  </p>
                </div>
              )}

              {/* AI reasoning — why this action */}
              <div className="rounded-lg border border-ai/20 bg-ai-muted/10 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ai">
                  <Sparkles className="size-4" />
                  Why did RecoverAI choose this action?
                </div>
                {decisionStep?.decision ? (
                  <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                    {decisionStep.decision.reasoning.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                    <li>
                      Root cause:{' '}
                      {selectedPayment.failureReason
                        ? FAILURE_REASON_LABELS[selectedPayment.failureReason]
                        : 'unknown'}
                      .
                    </li>
                    <li>
                      Model confidence {formatPercent(selectedPayment.aiConfidence)} at{' '}
                      {selectedPayment.risk} risk — recommended action is{' '}
                      {RECOVERY_ACTION_LABELS[selectedPayment.recommendedAction]}.
                    </li>
                    <li>Run the recovery pipeline to see the full decision, policy check and outcome.</li>
                  </ul>
                )}
                {predictionStep?.prediction && (
                  <div className="mt-3 border-t border-ai/15 pt-3">
                    <div className="mb-1.5 text-[11px] font-medium text-muted-foreground uppercase">
                      Model signals · {predictionStep.prediction.modelVersion}
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {predictionStep.prediction.factors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Run controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => void runRecovery()}
                  disabled={
                    running ||
                    selectedPayment.status === 'recovered' ||
                    selectedPayment.status === 'blocked'
                  }
                  className="gap-1.5"
                >
                  <Play className="size-3.5" />
                  {running ? 'Running…' : 'Run AI Recovery'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleReset()}
                  disabled={running}
                  className="gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
                {!running &&
                  !pause &&
                  steps.some((s) => s.verifyResult?.status === 'recovered') && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="size-3.5" />
                      Recovered
                    </Badge>
                  )}
              </div>

              {/* Pipeline progress */}
              {steps.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {AGENT_PIPELINE.map((stage, i) => {
                    const completed = steps[i] !== undefined
                    const active = running && i === steps.length && completed === false
                    return (
                      <span
                        key={stage.key}
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                          completed
                            ? 'border-success/40 bg-success/5 text-success'
                            : active
                              ? 'border-ai bg-ai/10 text-ai'
                              : 'border-border-strong text-muted-foreground',
                        )}
                      >
                        {stage.label}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No payment selected"
              description="Select a payment from the queue to inspect it."
              className="xl:col-span-2"
            />
          )}
        </div>
      )}

      {/* Inline human approval */}
      {pause && (
        <Card className="mt-6 border-warning/25 bg-warning-muted/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <ShieldAlert className="size-4 shrink-0 text-warning" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-warning">
                  Awaiting human approval · {pause.approval.id}
                </div>
                <div className="truncate text-xs text-muted-foreground">{pause.approval.reason}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                onClick={() => void handleApproval('approved')}
                disabled={running}
                className="gap-1"
              >
                <CheckCircle2 className="size-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleApproval('rejected')}
                disabled={running}
                className="gap-1 text-destructive"
              >
                <XCircle className="size-3.5" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notice */}
      {notice && (
        <div className="my-6 rounded-lg border border-border-strong bg-surface/60 px-4 py-3 text-sm text-foreground">
          {notice}
        </div>
      )}

      {/* Attempt history + outcomes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attempt history</CardTitle>
          <CardDescription>
            Every recovery action and recorded outcome for the selected payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 pt-0 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
              Recovery actions
            </div>
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recovery attempts yet.</p>
            ) : (
              actions.map((action, i) => {
                const status = recoveryActionStatusKey(action.status)
                return (
                  <div
                    key={action.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs"
                  >
                    <span className="font-mono text-muted-foreground">#{i + 1}</span>
                    <span className="font-medium text-foreground">
                      {RECOVERY_ACTION_LABELS[action.type]}
                    </span>
                    <Badge variant="neutral" className="capitalize">
                      {action.channel}
                    </Badge>
                    <StatusBadge status={status.key} label={status.label} />
                    <span className="text-muted-foreground">{timeLabel(action.scheduledAt)}</span>
                    {action.notes && (
                      <span className="w-full text-muted-foreground">{action.notes}</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
              Outcomes
            </div>
            {outcomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recorded outcomes yet.</p>
            ) : (
              outcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs"
                >
                  <Badge
                    variant={
                      outcome.result === 'recovered'
                        ? 'success'
                        : outcome.result === 'pending'
                          ? 'warning'
                          : 'danger'
                    }
                    className="capitalize"
                  >
                    {outcome.result}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {RECOVERY_ACTION_LABELS[outcome.action]}
                  </span>
                  <span className="capitalize text-muted-foreground">{outcome.channel}</span>
                  {outcome.amountRecovered !== undefined && (
                    <span className="font-medium tabular-nums text-success">
                      {formatCompactCurrency(outcome.amountRecovered)}
                    </span>
                  )}
                  {outcome.recoveredAt && (
                    <span className="text-muted-foreground">{timeLabel(outcome.recoveredAt)}</span>
                  )}
                  {outcome.notes && (
                    <span className="w-full text-muted-foreground">{outcome.notes}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}