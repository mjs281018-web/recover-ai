/**
 * Agent service — the autonomous recovery agent's decisions, event
 * stream, and a thin session orchestrator over existing services.
 * Integration-ready for a future ML prediction API / LLM agent
 * runtime (e.g. LangGraph); today it reads the synthetic demo dataset.
 */
import type {
  AgentDecision,
  AgentEvent,
  Approval,
  AgentEventKind,
  AgentState,
  AuditEvent,
  Payment,
  PaymentStatus,
  PolicyEvaluation,
  Prediction,
  RecoveryActionType,
  RecoveryOutcome,
  RecoveryStrategy,
} from '@/types'
import { demoAgentDecisions, demoAgentEvents, demoPredictions } from '@/data/demo'
import { FAILURE_REASON_LABELS, RECOVERY_ACTION_LABELS } from '@/types'
import type { PipelineStageKey } from '@/lib/recovery-pipeline'
import { resetSyntheticSimulation } from '@/lib/providers/payment-provider'
import { getPayment, retryPayment } from '@/services/payment-service'
import { getCustomer } from '@/services/customer-service'
import { listStrategies, listRecoveryOutcomes, recordRecoveryOutcome } from '@/services/recovery-service'
import {
  decideApproval,
  getApprovalForPayment,
  listApprovals,
  resetApprovalDecision,
} from '@/services/approval-service'
import { evaluatePolicy } from '@/services/policy-service'
import { recordAuditEvent, resetSessionAuditEvents } from '@/services/audit-service'
import { notifyRuntimeChange } from '@/lib/runtime-events'

const sessionAgentEventIds = new Set<string>()

export interface RecoveryActResult {
  kind: 'retried' | 'queued' | 'awaiting-approval' | 'blocked' | 'already-recovered' | 'held'
  ok: boolean
  message: string
}

export interface RecoveryVerifyResult {
  status: PaymentStatus
  outcome?: RecoveryOutcome
  message: string
}

export interface RecoveryStageSnapshot {
  paymentId: string
  stage: PipelineStageKey
  payment: Payment
  title: string
  description: string
  agentState: AgentState
  agentEvent: AgentEvent
  prediction?: Prediction
  decision?: AgentDecision
  matchedStrategies?: RecoveryStrategy[]
  policyEvaluation?: PolicyEvaluation
  actResult?: RecoveryActResult
  verifyResult?: RecoveryVerifyResult
  auditEvent?: AuditEvent
  approval?: Approval
}

export async function listAgentEvents(limit?: number): Promise<AgentEvent[]> {
  const sorted = [...demoAgentEvents].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
  return limit ? sorted.slice(0, limit) : sorted
}

export async function listAgentDecisions(paymentId?: string): Promise<AgentDecision[]> {
  const decisions = paymentId
    ? demoAgentDecisions.filter((d) => d.paymentId === paymentId)
    : demoAgentDecisions
  return [...decisions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function getPrediction(paymentId: string): Promise<Prediction | undefined> {
  return demoPredictions.find((p) => p.paymentId === paymentId)
}

export async function listPredictions(): Promise<Prediction[]> {
  return demoPredictions
}

/** Coarse agent activity state derived from pending decisions, for shell indicators. */
export async function getAgentState(): Promise<AgentState> {
  const pending = demoAgentDecisions.some((d) => d.requiresApproval)
  return pending ? 'awaiting-approval' : 'analyzing'
}

async function recordAgentEvent(event: AgentEvent): Promise<AgentEvent> {
  demoAgentEvents.push(event)
  sessionAgentEventIds.add(event.id)
  notifyRuntimeChange('agent-event', event.paymentId)
  return event
}

function clockTimestamp(): string {
  return new Date().toISOString()
}

function clockLabel(): string {
  return new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })
}

function eventKindForStage(stage: PipelineStageKey, actKind?: RecoveryActResult['kind']): AgentEventKind {
  if (stage === 'decide' || stage === 'policy-check') return 'decision'
  if (stage === 'act' && (actKind === 'awaiting-approval' || actKind === 'blocked')) return 'escalation'
  if (stage === 'act' || stage === 'verify' || stage === 'audit') return 'action'
  return 'analysis'
}

function fallbackPrediction(payment: Payment): Prediction {
  const factors = [
    payment.failureReason
      ? `Failure classified as ${FAILURE_REASON_LABELS[payment.failureReason]}`
      : 'No failure reason on file (payment may already be recovered)',
    `Risk level ${payment.risk}`,
    `${payment.attempts} recorded attempt${payment.attempts === 1 ? '' : 's'}`,
    `Channel ${payment.channel.toUpperCase()}`,
  ]
  return {
    id: `PR-session-${payment.id}`,
    paymentId: payment.id,
    modelVersion: 'recovery-gbm-v4.2',
    recoveryProbability: payment.recoveryProbability,
    confidence: payment.aiConfidence,
    factors,
    generatedAt: payment.updatedAt,
  }
}

async function resolveDecision(payment: Payment): Promise<{
  decision: AgentDecision
  matchedStrategies: RecoveryStrategy[]
}> {
  const existing = await listAgentDecisions(payment.id)
  const strategies = await listStrategies()
  const matched = payment.failureReason
    ? strategies.filter(
        (s) => s.status === 'active' && s.triggerFailureReasons.includes(payment.failureReason!),
      )
    : strategies.filter((s) => s.status === 'active').slice(0, 2)

  if (existing[0]) {
    return { decision: existing[0], matchedStrategies: matched }
  }

  const top = matched[0]
  const alternatives: RecoveryActionType[] = []
  if (payment.recommendedAction !== 'smart-retry') alternatives.push('smart-retry')
  if (payment.recommendedAction !== 'retry' && payment.recommendedAction !== 'hold') {
    alternatives.push('retry')
  }

  const decision: AgentDecision = {
    id: `AD-session-${payment.id}`,
    paymentId: payment.id,
    summary: RECOVERY_ACTION_LABELS[payment.recommendedAction],
    reasoning: [
      payment.failureReason
        ? `Root cause is ${FAILURE_REASON_LABELS[payment.failureReason]}.`
        : 'No failure reason present on this payment.',
      top
        ? `Matched strategy ${top.name} (${Math.round(top.successRate * 100)}% historical success).`
        : 'No specialised strategy matched; using the payment’s recommended action.',
      `Model confidence is ${Math.round(payment.aiConfidence * 100)}% at ${payment.risk} risk.`,
    ],
    confidence: payment.aiConfidence,
    recommendedAction: payment.recommendedAction,
    alternativeActions: alternatives,
    requiresApproval: payment.recommendedAction === 'human-approval',
    policyId: payment.recommendedAction === 'human-approval' ? 'PL-02' : 'PL-01',
    createdAt: payment.updatedAt,
  }

  return { decision, matchedStrategies: matched }
}

async function emitSnapshot(snapshot: Omit<RecoveryStageSnapshot, 'agentEvent'> & { agentEvent?: AgentEvent }): Promise<RecoveryStageSnapshot> {
  const timestamp = clockTimestamp()
  const agentEvent = await recordAgentEvent({
    id: `AE-session-${snapshot.paymentId}-${snapshot.stage}-${timestamp}`,
    kind: eventKindForStage(snapshot.stage, snapshot.actResult?.kind),
    title: snapshot.title,
    description: snapshot.description,
    paymentId: snapshot.paymentId,
    confidence: snapshot.decision?.confidence ?? snapshot.prediction?.confidence ?? snapshot.payment.aiConfidence,
    timestamp,
  })
  return { ...snapshot, agentEvent }
}

/**
 * Execute a single lifecycle stage for an existing demo payment.
 * Composes payment, customer, prediction, decision, policy, recovery, and audit services.
 */
export async function decideRecoveryApproval(
  paymentId: string,
  approvalId: string,
  decision: 'approved' | 'rejected',
): Promise<Approval | undefined> {
  const approval = await decideApproval(approvalId, decision)
  if (!approval || approval.paymentId !== paymentId) return undefined

  if (decision === 'rejected') {
    await recordAuditEvent({
      id: `A-session-${paymentId}-rejected-${Date.now()}`,
      actor: 'human',
      action: 'Rejected recovery approval',
      target: paymentId,
      timestamp: clockLabel(),
      status: 'failed',
    })
  }

  return approval
}

export async function runRecoveryStage(
  paymentId: string,
  stage: PipelineStageKey,
): Promise<RecoveryStageSnapshot> {
  const payment = await getPayment(paymentId)
  if (!payment) {
    throw new Error(`No demo payment found for ${paymentId}.`)
  }

  switch (stage) {
    case 'observe': {
      const title = `Observed ${payment.id}`
      const description =
        payment.status === 'recovered'
          ? `${payment.customerName} · ${payment.paymentMethodLabel} is already recovered.`
          : `${payment.customerName} · ${payment.paymentMethodLabel} is ${payment.status.replace('-', ' ')}.`
      return emitSnapshot({
        paymentId,
        stage,
        payment,
        title,
        description,
        agentState: 'analyzing',
      })
    }

    case 'analyze': {
      const customer = await getCustomer(payment.customerId)
      const reason = payment.failureReason
        ? FAILURE_REASON_LABELS[payment.failureReason]
        : 'No failure on file'
      const title = `Analyzed ${payment.id}`
      const description = [
        `Root cause: ${reason}.`,
        `Risk ${payment.risk}.`,
        customer
          ? `Customer ${customer.name} (${customer.segment}, ${customer.recoveredCount} prior recoveries, ${customer.failedCount} failures).`
          : `Customer ${payment.customerName}.`,
      ].join(' ')
      return emitSnapshot({
        paymentId,
        stage,
        payment,
        title,
        description,
        agentState: 'analyzing',
      })
    }

    case 'predict': {
      const stored = await getPrediction(paymentId)
      const prediction = stored ?? fallbackPrediction(payment)
      const title = `Predicted recovery for ${payment.id}`
      const description = `${Math.round(prediction.recoveryProbability * 100)}% recovery probability (${Math.round(prediction.confidence * 100)}% model confidence, ${prediction.modelVersion}).`
      return emitSnapshot({
        paymentId,
        stage,
        payment,
        title,
        description,
        agentState: 'analyzing',
        prediction,
      })
    }

    case 'decide': {
      const { decision, matchedStrategies } = await resolveDecision(payment)
      const title = `Decision for ${payment.id}`
      const description = `${decision.summary}${matchedStrategies[0] ? ` · strategy ${matchedStrategies[0].name}` : ''}.`
      return emitSnapshot({
        paymentId,
        stage,
        payment,
        title,
        description,
        agentState: decision.requiresApproval ? 'awaiting-approval' : 'analyzing',
        decision,
        matchedStrategies,
        prediction: (await getPrediction(paymentId)) ?? fallbackPrediction(payment),
      })
    }

    case 'policy-check': {
      const { decision } = await resolveDecision(payment)
      const policyEvaluation = await evaluatePolicy(payment, decision.recommendedAction)
      const title = `Policy check for ${payment.id}`
      const description = `${policyEvaluation.verdict === 'requiresApproval' ? 'Requires approval' : policyEvaluation.verdict === 'blocked' ? 'Blocked' : 'Allowed'} · ${policyEvaluation.policyId}: ${policyEvaluation.reason}`
      const agentState: AgentState = policyEvaluation.blocked
        ? 'paused'
        : policyEvaluation.requiresApproval
          ? 'awaiting-approval'
          : 'analyzing'
      const approval = policyEvaluation.requiresApproval ? await getApprovalForPayment(paymentId) : undefined
      return emitSnapshot({
        paymentId,
        stage,
        payment,
        title,
        description,
        agentState,
        decision: { ...decision, requiresApproval: policyEvaluation.requiresApproval, policyId: policyEvaluation.policyId },
        policyEvaluation,
        approval,
        prediction: (await getPrediction(paymentId)) ?? fallbackPrediction(payment),
      })
    }

    case 'act': {
      const { decision } = await resolveDecision(payment)
      const policyEvaluation = await evaluatePolicy(payment, decision.recommendedAction)
      let actResult: RecoveryActResult
      let agentState: AgentState = 'executing'

      const approval = policyEvaluation.requiresApproval ? await getApprovalForPayment(paymentId) : undefined

      if (policyEvaluation.requiresApproval && approval?.status !== 'approved') {
        actResult = {
          kind: 'awaiting-approval',
          ok: false,
          message:
            approval?.status === 'rejected'
              ? `Recovery approval was rejected for ${payment.id} — no retry was executed.`
              : `Awaiting human approval for ${payment.id} — no retry was executed.`,
        }
        agentState = approval?.status === 'rejected' ? 'paused' : 'awaiting-approval'
      } else if (payment.status === 'recovered') {
        actResult = {
          kind: 'already-recovered',
          ok: true,
          message: `${payment.id} is already recovered — no further action executed.`,
        }
        agentState = 'idle'
      } else if (policyEvaluation.blocked || payment.status === 'blocked') {
        actResult = {
          kind: 'blocked',
          ok: false,
          message: `Action blocked for ${payment.id}. ${policyEvaluation.reason}`,
        }
        agentState = 'paused'
      } else if (decision.recommendedAction === 'human-approval' && approval?.status !== 'approved') {
        const pending = (await listApprovals('pending')).find((a) => a.paymentId === paymentId)
        actResult = {
          kind: 'awaiting-approval',
          ok: false,
          message: pending
            ? `Held for human approval (${pending.id}): ${pending.reason}`
            : `Held for human approval under ${policyEvaluation.policyId}. Synthetic retry was not executed.`,
        }
        agentState = 'awaiting-approval'
      } else if (decision.recommendedAction === 'hold') {
        actResult = {
          kind: 'held',
          ok: true,
          message: `Hold applied for ${payment.id} — no retry submitted.`,
        }
        agentState = 'paused'
      } else {
        const retry = await retryPayment(paymentId)
        const latest = (await getPayment(paymentId)) ?? payment
        actResult = {
          kind: retry.ok ? 'retried' : 'queued',
          ok: retry.ok,
          message: retry.message,
        }
        agentState = retry.ok ? 'executing' : 'paused'
        return emitSnapshot({
          paymentId,
          stage,
          payment: latest,
          title: retry.ok ? `Acted on ${payment.id}` : `Action incomplete for ${payment.id}`,
          description: retry.message,
          agentState,
          decision: { ...decision, requiresApproval: policyEvaluation.requiresApproval, policyId: policyEvaluation.policyId },
          policyEvaluation,
          approval,
          actResult,
          prediction: (await getPrediction(paymentId)) ?? fallbackPrediction(latest),
        })
      }

      return emitSnapshot({
        paymentId,
        stage,
        payment,
        title:
          policyEvaluation.blocked || payment.status === 'blocked'
            ? `Action blocked for ${payment.id}`
            : actResult.kind === 'awaiting-approval'
              ? `Awaiting approval for ${payment.id}`
              : actResult.kind === 'already-recovered'
                ? `Already recovered ${payment.id}`
                : actResult.kind === 'held'
                  ? `Recovery held for ${payment.id}`
                  : `Acted on ${payment.id}`,
        description: actResult.message,
        agentState,
        decision: { ...decision, requiresApproval: policyEvaluation.requiresApproval, policyId: policyEvaluation.policyId },
        policyEvaluation,
        approval,
        actResult,
        prediction: (await getPrediction(paymentId)) ?? fallbackPrediction(payment),
      })
    }

    case 'verify': {
      const latest = (await getPayment(paymentId)) ?? payment
      const outcomes = await listRecoveryOutcomes(paymentId)
      let outcome = outcomes[0]
      const { decision } = await resolveDecision(payment)
      const policyEvaluation = await evaluatePolicy(payment, decision.recommendedAction)
      const approval = policyEvaluation.requiresApproval ? await getApprovalForPayment(paymentId) : undefined
      if (policyEvaluation.requiresApproval && approval?.status !== 'approved') {
        throw new Error(`Recovery approval is not complete for ${paymentId}.`)
      }

      if (latest.status === 'recovered' && !outcomes.some((o) => o.result === 'recovered')) {
        outcome = await recordRecoveryOutcome({
          id: `RO-session-${paymentId}`,
          paymentId,
          action: decision.recommendedAction,
          result: 'recovered',
          amountRecovered: latest.amount,
          channel: latest.channel,
          recoveredAt: clockTimestamp(),
          notes: 'Session synthetic recovery — no real funds moved.',
        })
      }

      const verifyResult: RecoveryVerifyResult = {
        status: latest.status,
        outcome,
        message:
          latest.status === 'recovered'
            ? `Verified recovered ${latest.amount} ${latest.currency} on ${latest.channel}.`
            : latest.status === 'pending-approval'
              ? 'Verified: still awaiting human approval. No recovery yet.'
              : latest.status === 'blocked'
                ? 'Verified: payment remains blocked. No recovery.'
                : `Verified current status: ${latest.status}.`,
      }

      return emitSnapshot({
        paymentId,
        stage,
        payment: latest,
        title: `Verified ${payment.id}`,
        description: verifyResult.message,
        agentState: latest.status === 'pending-approval' ? 'awaiting-approval' : latest.status === 'blocked' ? 'paused' : 'idle',
        decision,
        policyEvaluation,
        verifyResult,
        prediction: (await getPrediction(paymentId)) ?? fallbackPrediction(latest),
      })
    }

    case 'audit': {
      const latest = (await getPayment(paymentId)) ?? payment
      const { decision } = await resolveDecision(payment)
      const policyEvaluation = await evaluatePolicy(payment, decision.recommendedAction)
      const approval = policyEvaluation.requiresApproval ? await getApprovalForPayment(paymentId) : undefined
      if (policyEvaluation.requiresApproval && approval?.status !== 'approved') {
        throw new Error(`Recovery approval is not complete for ${paymentId}.`)
      }
      const outcomes = await listRecoveryOutcomes(paymentId)
      const auditStatus: AuditEvent['status'] =
        latest.status === 'recovered' ||
        latest.status === 'at-risk' ||
        latest.status === 'in-progress' ||
        latest.status === 'pending-approval' ||
        latest.status === 'failed' ||
        latest.status === 'blocked'
          ? latest.status
          : 'info'

      const auditEvent = await recordAuditEvent({
        id: `A-session-${paymentId}-${Date.now()}`,
        actor: 'ai-agent',
        action: `Lifecycle complete: ${RECOVERY_ACTION_LABELS[decision.recommendedAction]}`,
        target: paymentId,
        timestamp: clockLabel(),
        status: auditStatus,
      })

      return emitSnapshot({
        paymentId,
        stage,
        payment: latest,
        title: `Audited ${payment.id}`,
        description: `${auditEvent.action} · recorded at ${auditEvent.timestamp} (${auditEvent.status}).`,
        agentState: 'idle',
        decision,
        policyEvaluation,
        approval,
        auditEvent,
        verifyResult: {
          status: latest.status,
          outcome: outcomes[0],
          message: `Audit trail updated for ${paymentId}.`,
        },
        prediction: (await getPrediction(paymentId)) ?? fallbackPrediction(latest),
      })
    }

    default: {
      const _exhaustive: never = stage
      throw new Error(`Unknown recovery stage: ${String(_exhaustive)}`)
    }
  }
}

export async function resetRecoveryRun(paymentId: string): Promise<void> {
  await resetSyntheticSimulation(paymentId)
  await resetApprovalDecision(paymentId)
  await resetSessionAuditEvents(paymentId)

  for (let i = demoAgentEvents.length - 1; i >= 0; i--) {
    const event = demoAgentEvents[i]
    if (!sessionAgentEventIds.has(event.id)) continue
    if (event.paymentId !== paymentId) continue
    demoAgentEvents.splice(i, 1)
    sessionAgentEventIds.delete(event.id)
  }
}

