'use client'

/**
 * Runtime events — a lightweight pub/sub that lets client components
 * react to mutations made by the agent service (and other interactive
 * surfaces) without a server round-trip.
 *
 * The agent service and payment provider mutate the in-memory demo
 * datasets directly.  After every mutation they call `notifyRuntimeChange`
 * which fires all registered listeners.  Pages that display derived data
 * subscribe via `useRuntimeEvents` and re-fetch from the service layer,
 * so every page stays consistent with the same underlying state.
 */

type RuntimeEventType =
  | 'payment-updated'
  | 'approval-decided'
  | 'recovery-action'
  | 'agent-event'
  | 'audit-event'
  | 'batch-simulated'
  | 'reset'

interface RuntimeEvent {
  type: RuntimeEventType
  paymentId?: string
  timestamp: number
}

type Listener = (event: RuntimeEvent) => void

const listeners = new Set<Listener>()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyRuntimeChange(
  type: RuntimeEventType,
  paymentId?: string,
): void {
  const event: RuntimeEvent = {
    type,
    paymentId,
    timestamp: Date.now(),
  }
  for (const listener of listeners) {
    listener(event)
  }
}
