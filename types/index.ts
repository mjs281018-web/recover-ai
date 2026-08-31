/**
 * Core domain types for RecoverAI.
 * These describe the shape of data the product will eventually receive from
 * the ML prediction API, recovery engine, and payment provider adapters.
 * For the foundation phase all values are synthetic (see /data/demo.ts).
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | 'recovered'
  | 'at-risk'
  | 'in-progress'
  | 'pending-approval'
  | 'failed'
  | 'blocked'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type RecoveryChannel = 'card' | 'upi' | 'netbanking' | 'wallet' | 'mandate'

export type CustomerSegment = 'consumer' | 'sme' | 'enterprise'

export type FailureReason =
  | 'insufficient-funds'
  | 'bank-decline'
  | 'timeout'
  | 'card-expired'
  | 'mandate-expired'
  | 'issuer-decline'
  | 'network-error'
  | 'fraud-suspected'
  | 'card-lost'
  | 'invalid-account'
  | 'processor-error'

export const FAILURE_REASON_LABELS: Record<FailureReason, string> = {
  'insufficient-funds': 'Insufficient funds',
  'bank-decline': 'Bank declined',
  timeout: 'Gateway timeout',
  'card-expired': 'Card expired',
  'mandate-expired': 'Mandate expired',
  'issuer-decline': 'Issuer declined',
  'network-error': 'Network error',
  'fraud-suspected': 'Fraud suspected',
  'card-lost': 'Card reported lost',
  'invalid-account': 'Invalid account details',
  'processor-error': 'Processor error',
}

export type RecoveryActionType =
  | 'retry'
  | 'smart-retry'
  | 'send-reminder'
  | 'update-payment-method'
  | 'human-approval'
  | 'escalate'
  | 'switch-channel'
  | 'hold'
  | 'write-off'

export const RECOVERY_ACTION_LABELS: Record<RecoveryActionType, string> = {
  retry: 'Retry payment',
  'smart-retry': 'Smart retry (adaptive timing)',
  'send-reminder': 'Send payment reminder',
  'update-payment-method': 'Request updated payment method',
  'human-approval': 'Route to human approval',
  escalate: 'Escalate to specialist',
  'switch-channel': 'Switch recovery channel',
  hold: 'Hold — do not retry',
  'write-off': 'Write off',
}

export type RecoveryActionStatus =
  | 'queued'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'awaiting-approval'
  | 'cancelled'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired'

export type PolicyStatus = 'active' | 'draft' | 'disabled'

export type AgentState = 'idle' | 'analyzing' | 'executing' | 'awaiting-approval' | 'paused'

export type AuditActor = 'ai-agent' | 'system' | 'human'

// ---------------------------------------------------------------------------
// Payments & customers
// ---------------------------------------------------------------------------

export interface Payment {
  id: string
  customerId: string
  customerName: string
  amount: number
  currency: 'INR'
  status: PaymentStatus
  channel: RecoveryChannel
  /** human-readable instrument, e.g. "HDFC Bank •• 4821" */
  paymentMethodLabel: string
  risk: RiskLevel
  /** model-estimated probability of recovering this payment, 0–1 */
  recoveryProbability: number
  /** model confidence in that estimate, 0–1 */
  aiConfidence: number
  failureReason?: FailureReason
  recommendedAction: RecoveryActionType
  segment: CustomerSegment
  attempts: number
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  segment: CustomerSegment
  lifetimeValue: number
  activeMandates: number
  recoveredCount: number
  failedCount: number
  riskProfile: RiskLevel
  joinedAt: string
}

// ---------------------------------------------------------------------------
// Recovery execution
// ---------------------------------------------------------------------------

export interface RecoveryAction {
  id: string
  paymentId: string
  type: RecoveryActionType
  status: RecoveryActionStatus
  channel: RecoveryChannel
  initiatedBy: AuditActor
  scheduledAt: string
  completedAt?: string
  notes?: string
}

export interface RecoveryOutcome {
  id: string
  paymentId: string
  action: RecoveryActionType
  result: 'recovered' | 'failed' | 'pending'
  amountRecovered?: number
  channel: RecoveryChannel
  recoveredAt?: string
  notes?: string
}

export interface RecoveryStrategy {
  id: string
  name: string
  description: string
  status: 'active' | 'draft' | 'paused'
  channelPriority: RecoveryChannel[]
  triggerFailureReasons: FailureReason[]
  maxRetries: number
  successRate: number
  paymentsCovered: number
  updatedAt: string
}

export interface Batch {
  id: string
  name: string
  strategyId: string
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'paused'
  paymentCount: number
  totalAmount: number
  recoveredAmount: number
  /** 0–1 completion progress */
  progress: number
  startedAt: string
  completedAt?: string
}

// ---------------------------------------------------------------------------
// AI agent
// ---------------------------------------------------------------------------

export interface AgentDecision {
  id: string
  paymentId: string
  summary: string
  reasoning: string[]
  confidence: number
  recommendedAction: RecoveryActionType
  alternativeActions: RecoveryActionType[]
  requiresApproval: boolean
  policyId?: string
  createdAt: string
}

export type AgentEventKind = 'analysis' | 'decision' | 'action' | 'escalation' | 'learning'

export interface AgentEvent {
  id: string
  kind: AgentEventKind
  title: string
  description: string
  paymentId?: string
  confidence?: number
  timestamp: string
}

export interface Prediction {
  id: string
  paymentId: string
  modelVersion: string
  recoveryProbability: number
  confidence: number
  factors: string[]
  generatedAt: string
}

export interface RecoveryInsight {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'trend' | 'anomaly' | 'opportunity' | 'risk'
  metricDelta?: number
  createdAt: string
}

// ---------------------------------------------------------------------------
// Governance
// ---------------------------------------------------------------------------

export interface Policy {
  id: string
  name: string
  description: string
  status: PolicyStatus
  category: 'approval-threshold' | 'retry-limit' | 'channel-restriction' | 'risk-guardrail' | 'compliance'
  rule: string
  threshold?: number
  updatedAt: string
  updatedBy: AuditActor
}

export type PolicyVerdict = 'allowed' | 'requiresApproval' | 'blocked'

/** Result of evaluating active demo policies against a payment + intended action. */
export interface PolicyEvaluation {
  verdict: PolicyVerdict
  allowed: boolean
  requiresApproval: boolean
  blocked: boolean
  policyId: string
  reason: string
}

export interface Approval {
  id: string
  paymentId: string
  amount: number
  reason: string
  riskLevel: RiskLevel
  requestedBy: AuditActor
  status: ApprovalStatus
  requestedAt: string
  decidedAt?: string
  decidedBy?: AuditActor
}

export interface AuditEvent {
  id: string
  actor: AuditActor
  action: string
  target: string
  timestamp: string
  status: PaymentStatus | 'info'
}

// ---------------------------------------------------------------------------
// Shell / UI support types
// ---------------------------------------------------------------------------

export type NotificationKind = 'success' | 'warning' | 'ai' | 'danger'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  detail: string
  timestamp: string
  unread: boolean
}

export type SearchResultType =
  | 'payment'
  | 'customer'
  | 'transaction'
  | 'audit'
  | 'action'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
}

// ---------------------------------------------------------------------------
// Command-center analytics & visualizations
// ---------------------------------------------------------------------------

export interface RevenueTrendPoint {
  date: string
  label: string
  atRisk: number
  recoverable: number
  recovered: number
}

export interface FailureReasonBreakdown {
  reason: FailureReason | 'other'
  label: string
  share: number
  revenueImpact: number
  recoverability: 'high' | 'medium' | 'low'
  recoveryRate: number
}

export interface ChannelPerformance {
  channel: RecoveryChannel
  label: string
  failureRate: number
  recoveryRate: number
  revenueRecovered: number
}

export interface InterventionPerformance {
  action: RecoveryActionType
  label: string
  recoveryRate: number
  revenueRecovered: number
  risk: RiskLevel
}

export interface ProbabilityBucket {
  bucketLabel: string
  paymentCount: number
}

export interface ExpectedVsActualPoint {
  label: string
  expected: number
  actual: number
}

export interface SegmentRisk {
  segment: CustomerSegment
  label: string
  revenueAtRisk: number
  paymentCount: number
}

export interface RecoveryForecastPoint {
  label: string
  projected: number
  low: number
  high: number
  isForecast: boolean
}

export interface RecoveryForecast {
  next24hAmount: number
  confidence: number
  series: RecoveryForecastPoint[]
}

export interface EarlyWarning {
  id: string
  title: string
  metricLabel: string
  fromValue: string
  toValue: string
  revenueAtRisk: number
  cause: string
  recommendedAction: string
  severity: RiskLevel
  confidence: number
}

export interface RootCauseInsight {
  id: string
  reason: FailureReason
  label: string
  frequency: number
  revenueImpact: number
  recoverability: 'high' | 'medium' | 'low'
  recommendedIntervention: RecoveryActionType
}

export type RecoveryFunnelStageKey =
  | 'at-risk'
  | 'identified-recoverable'
  | 'actions-initiated'
  | 'recovered'

export interface RecoveryFunnelStage {
  key: RecoveryFunnelStageKey
  label: string
  paymentCount: number
  revenue: number
  conversionFromPrevious?: number
  topFailureReasons?: string[]
  strategy?: string
}

export interface SecondaryMetrics {
  aiActionsExecuted: number
  humanEscalations: number
  safetyBlocks: number
  averageRecoveryTimeMinutes: number
}
