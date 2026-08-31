/**
 * Agent service — the autonomous recovery agent's decisions and event
 * stream. Integration-ready for a future ML prediction API / LLM agent
 * runtime (e.g. LangGraph); today it reads the synthetic demo dataset.
 */
import type { AgentDecision, AgentEvent, AgentState, Prediction } from '@/types'
import { demoAgentDecisions, demoAgentEvents, demoPredictions } from '@/data/demo'

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
