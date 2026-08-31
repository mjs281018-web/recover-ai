/**
 * Canonical eight-stage recovery lifecycle shared by the Agent Command Center
 * and the overview state machine. Keep this list in one place so stage keys
 * cannot drift between surfaces.
 */

export const AGENT_PIPELINE = [
  { key: 'observe', label: 'Observe', description: 'Payment failure detected' },
  { key: 'analyze', label: 'Analyze', description: 'Root cause identified' },
  { key: 'predict', label: 'Predict', description: 'Recovery probability calculated' },
  { key: 'decide', label: 'Decide', description: 'Best intervention selected' },
  { key: 'policy-check', label: 'Policy check', description: 'Action evaluated against policy' },
  { key: 'act', label: 'Act', description: 'Recovery action executed' },
  { key: 'verify', label: 'Verify', description: 'Payment outcome confirmed' },
  { key: 'audit', label: 'Audit', description: 'Decision recorded' },
] as const

export type PipelineStageKey = (typeof AGENT_PIPELINE)[number]['key']

/** Existing demo payments used as Command Center simulation subjects. */
export const DEMO_SIMULATION_PAYMENT_IDS = ['P10982', 'P10481', 'P11276', 'P10234'] as const

export type DemoSimulationPaymentId = (typeof DEMO_SIMULATION_PAYMENT_IDS)[number]
