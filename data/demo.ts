import type {
  Payment,
  Customer,
  AppNotification,
  AuditEvent,
  SearchResult,
  RecoveryAction,
  RecoveryOutcome,
  RecoveryStrategy,
  Batch,
  AgentDecision,
  AgentEvent,
  Prediction,
  RecoveryInsight,
  Policy,
  Approval,
  RevenueTrendPoint,
  FailureReasonBreakdown,
  ChannelPerformance,
  InterventionPerformance,
  ProbabilityBucket,
  ExpectedVsActualPoint,
  SegmentRisk,
  RecoveryForecast,
  EarlyWarning,
  RootCauseInsight,
  RecoveryFunnelStage,
  SecondaryMetrics,
} from '@/types'

/**
 * DEMO MODE — SYNTHETIC TRANSACTIONS
 * ------------------------------------------------------------------------
 * Every record in this file is fabricated for demonstration purposes.
 * None of these payments, customers, or events represent real money
 * movement, real people, or real financial data. This is the seed layer
 * the RecoverAI shell renders against during the foundation phase — it
 * will later be replaced by live data from the prediction API, recovery
 * engine, and payment provider adapters (see /lib/providers).
 */

export const DEMO_BANNER = 'DEMO MODE — SYNTHETIC TRANSACTIONS'
export const DEMO_PROVIDER_LABEL = 'DEMO PROVIDER — SYNTHETIC'

export const demoMerchant = {
  name: 'Demo Merchant',
  workspace: 'Fintech Workspace',
  email: 'ops@demo-merchant.test',
  initials: 'DM',
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const demoCustomers: Customer[] = [
  { id: 'C-4192', name: 'Rahul Sharma', email: 'rahul.sharma@example.test', segment: 'consumer', lifetimeValue: 184_000, activeMandates: 2, recoveredCount: 4, failedCount: 1, riskProfile: 'low', joinedAt: '2024-02-11T00:00:00+05:30' },
  { id: 'C-4207', name: 'Amit Patil', email: 'amit.patil@example.test', segment: 'consumer', lifetimeValue: 92_500, activeMandates: 1, recoveredCount: 2, failedCount: 1, riskProfile: 'medium', joinedAt: '2024-05-03T00:00:00+05:30' },
  { id: 'C-4233', name: 'Priya Deshmukh', email: 'priya.deshmukh@example.test', segment: 'sme', lifetimeValue: 311_000, activeMandates: 3, recoveredCount: 7, failedCount: 0, riskProfile: 'low', joinedAt: '2023-11-20T00:00:00+05:30' },
  { id: 'C-4288', name: 'Sneha Iyer', email: 'sneha.iyer@example.test', segment: 'consumer', lifetimeValue: 57_400, activeMandates: 1, recoveredCount: 1, failedCount: 2, riskProfile: 'high', joinedAt: '2024-09-14T00:00:00+05:30' },
  { id: 'C-4310', name: 'Vikram Nair', email: 'vikram.nair@example.test', segment: 'sme', lifetimeValue: 218_900, activeMandates: 2, recoveredCount: 5, failedCount: 1, riskProfile: 'medium', joinedAt: '2024-01-29T00:00:00+05:30' },
  { id: 'C-4325', name: 'Ananya Gupta', email: 'ananya.gupta@example.test', segment: 'consumer', lifetimeValue: 41_200, activeMandates: 1, recoveredCount: 3, failedCount: 0, riskProfile: 'low', joinedAt: '2025-01-08T00:00:00+05:30' },
  { id: 'C-4356', name: 'Karan Mehta', email: 'karan.mehta@example.test', segment: 'enterprise', lifetimeValue: 1_240_000, activeMandates: 6, recoveredCount: 14, failedCount: 2, riskProfile: 'low', joinedAt: '2023-06-02T00:00:00+05:30' },
  { id: 'C-4372', name: 'Divya Reddy', email: 'divya.reddy@example.test', segment: 'consumer', lifetimeValue: 68_300, activeMandates: 1, recoveredCount: 1, failedCount: 3, riskProfile: 'critical', joinedAt: '2024-11-30T00:00:00+05:30' },
  { id: 'C-4390', name: 'Arjun Kulkarni', email: 'arjun.kulkarni@example.test', segment: 'sme', lifetimeValue: 156_700, activeMandates: 2, recoveredCount: 4, failedCount: 1, riskProfile: 'medium', joinedAt: '2024-07-17T00:00:00+05:30' },
  { id: 'C-4401', name: 'Meera Joshi', email: 'meera.joshi@example.test', segment: 'consumer', lifetimeValue: 33_800, activeMandates: 1, recoveredCount: 2, failedCount: 0, riskProfile: 'low', joinedAt: '2025-03-22T00:00:00+05:30' },
]

// ---------------------------------------------------------------------------
// Payments — at least 15–30 synthetic transactions across every status,
// channel, risk level, and failure reason so tables and analytics populate.
// ---------------------------------------------------------------------------

export const demoPayments: Payment[] = [
  { id: 'P10234', customerId: 'C-4192', customerName: 'Rahul Sharma', amount: 2_499, currency: 'INR', status: 'recovered', channel: 'upi', paymentMethodLabel: 'UPI — rahul@okhdfc', risk: 'low', recoveryProbability: 0.94, aiConfidence: 0.92, recommendedAction: 'retry', segment: 'consumer', attempts: 1, createdAt: '2026-08-30T09:12:00+05:30', updatedAt: '2026-08-30T09:14:00+05:30' },
  { id: 'P10481', customerId: 'C-4233', customerName: 'Priya Deshmukh', amount: 18_500, currency: 'INR', status: 'pending-approval', channel: 'card', paymentMethodLabel: 'HDFC Bank •• 4821', risk: 'high', recoveryProbability: 0.61, aiConfidence: 0.88, failureReason: 'insufficient-funds', recommendedAction: 'human-approval', segment: 'sme', attempts: 2, createdAt: '2026-08-30T08:41:00+05:30', updatedAt: '2026-08-30T08:45:00+05:30' },
  { id: 'P10982', customerId: 'C-4207', customerName: 'Amit Patil', amount: 7_800, currency: 'INR', status: 'at-risk', channel: 'mandate', paymentMethodLabel: 'NACH Mandate •• 7712', risk: 'medium', recoveryProbability: 0.78, aiConfidence: 0.83, failureReason: 'mandate-expired', recommendedAction: 'update-payment-method', segment: 'consumer', attempts: 0, createdAt: '2026-08-30T08:05:00+05:30', updatedAt: '2026-08-30T08:05:00+05:30' },
  { id: 'P11044', customerId: 'C-4288', customerName: 'Sneha Iyer', amount: 4_250, currency: 'INR', status: 'in-progress', channel: 'netbanking', paymentMethodLabel: 'ICICI Netbanking', risk: 'medium', recoveryProbability: 0.70, aiConfidence: 0.81, failureReason: 'timeout', recommendedAction: 'smart-retry', segment: 'consumer', attempts: 1, createdAt: '2026-08-30T07:58:00+05:30', updatedAt: '2026-08-30T08:02:00+05:30' },
  { id: 'P11090', customerId: 'C-4192', customerName: 'Rahul Sharma', amount: 12_300, currency: 'INR', status: 'failed', channel: 'card', paymentMethodLabel: 'Axis Bank •• 2098', risk: 'critical', recoveryProbability: 0.22, aiConfidence: 0.90, failureReason: 'card-lost', recommendedAction: 'hold', segment: 'consumer', attempts: 3, createdAt: '2026-08-30T07:30:00+05:30', updatedAt: '2026-08-30T07:40:00+05:30' },
  { id: 'P11132', customerId: 'C-4233', customerName: 'Priya Deshmukh', amount: 2_499, currency: 'INR', status: 'recovered', channel: 'wallet', paymentMethodLabel: 'Paytm Wallet', risk: 'low', recoveryProbability: 0.91, aiConfidence: 0.89, recommendedAction: 'retry', segment: 'sme', attempts: 1, createdAt: '2026-08-30T07:11:00+05:30', updatedAt: '2026-08-30T07:13:00+05:30' },
  { id: 'P11178', customerId: 'C-4310', customerName: 'Vikram Nair', amount: 34_600, currency: 'INR', status: 'at-risk', channel: 'card', paymentMethodLabel: 'SBI Card •• 5510', risk: 'high', recoveryProbability: 0.58, aiConfidence: 0.85, failureReason: 'issuer-decline', recommendedAction: 'switch-channel', segment: 'sme', attempts: 1, createdAt: '2026-08-30T06:52:00+05:30', updatedAt: '2026-08-30T06:55:00+05:30' },
  { id: 'P11205', customerId: 'C-4325', customerName: 'Ananya Gupta', amount: 999, currency: 'INR', status: 'recovered', channel: 'upi', paymentMethodLabel: 'UPI — ananya@okaxis', risk: 'low', recoveryProbability: 0.97, aiConfidence: 0.95, recommendedAction: 'retry', segment: 'consumer', attempts: 1, createdAt: '2026-08-30T06:20:00+05:30', updatedAt: '2026-08-30T06:22:00+05:30' },
  { id: 'P11249', customerId: 'C-4356', customerName: 'Karan Mehta', amount: 128_000, currency: 'INR', status: 'pending-approval', channel: 'mandate', paymentMethodLabel: 'NACH Mandate •• 3391', risk: 'high', recoveryProbability: 0.66, aiConfidence: 0.87, failureReason: 'insufficient-funds', recommendedAction: 'human-approval', segment: 'enterprise', attempts: 1, createdAt: '2026-08-30T05:47:00+05:30', updatedAt: '2026-08-30T05:50:00+05:30' },
  { id: 'P11276', customerId: 'C-4372', customerName: 'Divya Reddy', amount: 3_150, currency: 'INR', status: 'blocked', channel: 'card', paymentMethodLabel: 'Kotak Card •• 9042', risk: 'critical', recoveryProbability: 0.11, aiConfidence: 0.93, failureReason: 'fraud-suspected', recommendedAction: 'hold', segment: 'consumer', attempts: 0, createdAt: '2026-08-30T05:15:00+05:30', updatedAt: '2026-08-30T05:16:00+05:30' },
  { id: 'P11301', customerId: 'C-4390', customerName: 'Arjun Kulkarni', amount: 15_750, currency: 'INR', status: 'in-progress', channel: 'upi', paymentMethodLabel: 'UPI — arjun@okicici', risk: 'medium', recoveryProbability: 0.73, aiConfidence: 0.80, failureReason: 'timeout', recommendedAction: 'smart-retry', segment: 'sme', attempts: 2, createdAt: '2026-08-30T04:58:00+05:30', updatedAt: '2026-08-30T05:02:00+05:30' },
  { id: 'P11328', customerId: 'C-4401', customerName: 'Meera Joshi', amount: 1_899, currency: 'INR', status: 'recovered', channel: 'upi', paymentMethodLabel: 'UPI — meera@oksbi', risk: 'low', recoveryProbability: 0.96, aiConfidence: 0.94, recommendedAction: 'retry', segment: 'consumer', attempts: 1, createdAt: '2026-08-30T04:30:00+05:30', updatedAt: '2026-08-30T04:32:00+05:30' },
  { id: 'P11355', customerId: 'C-4288', customerName: 'Sneha Iyer', amount: 6_400, currency: 'INR', status: 'failed', channel: 'netbanking', paymentMethodLabel: 'Yes Bank Netbanking', risk: 'high', recoveryProbability: 0.31, aiConfidence: 0.86, failureReason: 'invalid-account', recommendedAction: 'update-payment-method', segment: 'consumer', attempts: 3, createdAt: '2026-08-30T03:55:00+05:30', updatedAt: '2026-08-30T04:01:00+05:30' },
  { id: 'P11402', customerId: 'C-4207', customerName: 'Amit Patil', amount: 9_200, currency: 'INR', status: 'at-risk', channel: 'card', paymentMethodLabel: 'HDFC Bank •• 6673', risk: 'medium', recoveryProbability: 0.64, aiConfidence: 0.79, failureReason: 'bank-decline', recommendedAction: 'smart-retry', segment: 'consumer', attempts: 1, createdAt: '2026-08-30T03:22:00+05:30', updatedAt: '2026-08-30T03:24:00+05:30' },
  { id: 'P11440', customerId: 'C-4356', customerName: 'Karan Mehta', amount: 54_000, currency: 'INR', status: 'recovered', channel: 'mandate', paymentMethodLabel: 'NACH Mandate •• 3391', risk: 'low', recoveryProbability: 0.89, aiConfidence: 0.91, recommendedAction: 'retry', segment: 'enterprise', attempts: 1, createdAt: '2026-08-30T02:47:00+05:30', updatedAt: '2026-08-30T02:50:00+05:30' },
  { id: 'P11478', customerId: 'C-4325', customerName: 'Ananya Gupta', amount: 2_250, currency: 'INR', status: 'at-risk', channel: 'wallet', paymentMethodLabel: 'PhonePe Wallet', risk: 'medium', recoveryProbability: 0.69, aiConfidence: 0.77, failureReason: 'network-error', recommendedAction: 'retry', segment: 'consumer', attempts: 0, createdAt: '2026-08-30T02:10:00+05:30', updatedAt: '2026-08-30T02:10:00+05:30' },
  { id: 'P11512', customerId: 'C-4310', customerName: 'Vikram Nair', amount: 41_300, currency: 'INR', status: 'in-progress', channel: 'card', paymentMethodLabel: 'SBI Card •• 5510', risk: 'medium', recoveryProbability: 0.72, aiConfidence: 0.82, failureReason: 'issuer-decline', recommendedAction: 'smart-retry', segment: 'sme', attempts: 1, createdAt: '2026-08-30T01:44:00+05:30', updatedAt: '2026-08-30T01:48:00+05:30' },
  { id: 'P11549', customerId: 'C-4372', customerName: 'Divya Reddy', amount: 5_600, currency: 'INR', status: 'failed', channel: 'card', paymentMethodLabel: 'Kotak Card •• 9042', risk: 'critical', recoveryProbability: 0.14, aiConfidence: 0.92, failureReason: 'card-expired', recommendedAction: 'update-payment-method', segment: 'consumer', attempts: 4, createdAt: '2026-08-30T01:02:00+05:30', updatedAt: '2026-08-30T01:10:00+05:30' },
  { id: 'P11583', customerId: 'C-4390', customerName: 'Arjun Kulkarni', amount: 22_100, currency: 'INR', status: 'pending-approval', channel: 'netbanking', paymentMethodLabel: 'Axis Netbanking', risk: 'high', recoveryProbability: 0.55, aiConfidence: 0.84, failureReason: 'processor-error', recommendedAction: 'human-approval', segment: 'sme', attempts: 2, createdAt: '2026-08-29T23:38:00+05:30', updatedAt: '2026-08-29T23:42:00+05:30' },
  { id: 'P11607', customerId: 'C-4401', customerName: 'Meera Joshi', amount: 1_299, currency: 'INR', status: 'recovered', channel: 'upi', paymentMethodLabel: 'UPI — meera@oksbi', risk: 'low', recoveryProbability: 0.95, aiConfidence: 0.93, recommendedAction: 'retry', segment: 'consumer', attempts: 1, createdAt: '2026-08-29T22:51:00+05:30', updatedAt: '2026-08-29T22:53:00+05:30' },
  { id: 'P11642', customerId: 'C-4192', customerName: 'Rahul Sharma', amount: 8_750, currency: 'INR', status: 'at-risk', channel: 'mandate', paymentMethodLabel: 'NACH Mandate •• 7712', risk: 'medium', recoveryProbability: 0.67, aiConfidence: 0.78, failureReason: 'mandate-expired', recommendedAction: 'update-payment-method', segment: 'consumer', attempts: 0, createdAt: '2026-08-29T21:15:00+05:30', updatedAt: '2026-08-29T21:15:00+05:30' },
  { id: 'P11689', customerId: 'C-4233', customerName: 'Priya Deshmukh', amount: 63_400, currency: 'INR', status: 'in-progress', channel: 'card', paymentMethodLabel: 'HDFC Bank •• 4821', risk: 'medium', recoveryProbability: 0.75, aiConfidence: 0.83, failureReason: 'timeout', recommendedAction: 'smart-retry', segment: 'sme', attempts: 1, createdAt: '2026-08-29T20:30:00+05:30', updatedAt: '2026-08-29T20:34:00+05:30' },
]

// ---------------------------------------------------------------------------
// Recovery actions & outcomes
// ---------------------------------------------------------------------------

export const demoRecoveryActions: RecoveryAction[] = [
  { id: 'RA-5001', paymentId: 'P10234', type: 'retry', status: 'completed', channel: 'upi', initiatedBy: 'ai-agent', scheduledAt: '2026-08-30T09:12:30+05:30', completedAt: '2026-08-30T09:14:00+05:30', notes: 'Retried within 2 minutes of decline; issuer had settled overnight funds.' },
  { id: 'RA-5002', paymentId: 'P10481', type: 'human-approval', status: 'awaiting-approval', channel: 'card', initiatedBy: 'ai-agent', scheduledAt: '2026-08-30T08:42:00+05:30', notes: 'Amount exceeds auto-retry threshold; routed to approvals queue.' },
  { id: 'RA-5003', paymentId: 'P10982', type: 'update-payment-method', status: 'queued', channel: 'mandate', initiatedBy: 'ai-agent', scheduledAt: '2026-08-30T09:00:00+05:30', notes: 'Mandate expires in 2 days — reminder scheduled before retry.' },
  { id: 'RA-5004', paymentId: 'P11044', type: 'smart-retry', status: 'in-progress', channel: 'netbanking', initiatedBy: 'ai-agent', scheduledAt: '2026-08-30T08:10:00+05:30', notes: 'Backing off 20 minutes after gateway timeout.' },
  { id: 'RA-5005', paymentId: 'P11090', type: 'hold', status: 'completed', channel: 'card', initiatedBy: 'human', scheduledAt: '2026-08-30T07:35:00+05:30', completedAt: '2026-08-30T07:40:00+05:30', notes: 'Card reported lost — all retries blocked pending new instrument.' },
  { id: 'RA-5006', paymentId: 'P11178', type: 'switch-channel', status: 'queued', channel: 'upi', initiatedBy: 'ai-agent', scheduledAt: '2026-08-30T07:10:00+05:30', notes: 'Card channel declined twice; agent recommends UPI fallback.' },
  { id: 'RA-5007', paymentId: 'P11249', type: 'human-approval', status: 'awaiting-approval', channel: 'mandate', initiatedBy: 'ai-agent', scheduledAt: '2026-08-30T05:48:00+05:30', notes: 'Enterprise account, high value — requires sign-off.' },
  { id: 'RA-5008', paymentId: 'P11301', type: 'smart-retry', status: 'in-progress', channel: 'upi', initiatedBy: 'ai-agent', scheduledAt: '2026-08-30T05:10:00+05:30', notes: 'Second attempt scheduled after network error window closed.' },
  { id: 'RA-5009', paymentId: 'P11355', type: 'update-payment-method', status: 'failed', channel: 'netbanking', initiatedBy: 'ai-agent', scheduledAt: '2026-08-30T04:00:00+05:30', completedAt: '2026-08-30T04:05:00+05:30', notes: 'Customer has not responded to update request after 3 attempts.' },
  { id: 'RA-5010', paymentId: 'P11689', type: 'smart-retry', status: 'in-progress', channel: 'card', initiatedBy: 'ai-agent', scheduledAt: '2026-08-29T20:40:00+05:30', notes: 'Large SME invoice — retrying during customer\u2019s typical settlement window.' },
]

export const demoRecoveryOutcomes: RecoveryOutcome[] = [
  { id: 'RO-7001', paymentId: 'P10234', action: 'retry', result: 'recovered', amountRecovered: 2_499, channel: 'upi', recoveredAt: '2026-08-30T09:14:00+05:30' },
  { id: 'RO-7002', paymentId: 'P11132', action: 'retry', result: 'recovered', amountRecovered: 2_499, channel: 'wallet', recoveredAt: '2026-08-30T07:13:00+05:30' },
  { id: 'RO-7003', paymentId: 'P11205', action: 'retry', result: 'recovered', amountRecovered: 999, channel: 'upi', recoveredAt: '2026-08-30T06:22:00+05:30' },
  { id: 'RO-7004', paymentId: 'P11328', action: 'retry', result: 'recovered', amountRecovered: 1_899, channel: 'upi', recoveredAt: '2026-08-30T04:32:00+05:30' },
  { id: 'RO-7005', paymentId: 'P11440', action: 'retry', result: 'recovered', amountRecovered: 54_000, channel: 'mandate', recoveredAt: '2026-08-30T02:50:00+05:30' },
  { id: 'RO-7006', paymentId: 'P11607', action: 'retry', result: 'recovered', amountRecovered: 1_299, channel: 'upi', recoveredAt: '2026-08-29T22:53:00+05:30' },
  { id: 'RO-7007', paymentId: 'P11090', action: 'hold', result: 'failed', channel: 'card', notes: 'Card reported lost — recovery abandoned.' },
  { id: 'RO-7008', paymentId: 'P11355', action: 'update-payment-method', result: 'failed', channel: 'netbanking', notes: 'No response to update request.' },
  { id: 'RO-7009', paymentId: 'P11549', action: 'update-payment-method', result: 'failed', channel: 'card', notes: 'Card expired, no replacement on file.' },
  { id: 'RO-7010', paymentId: 'P11044', action: 'smart-retry', result: 'pending', channel: 'netbanking' },
]

// ---------------------------------------------------------------------------
// Strategies & batches
// ---------------------------------------------------------------------------

export const demoStrategies: RecoveryStrategy[] = [
  { id: 'S-01', name: 'Soft decline smart retry', description: 'Adaptive retry timing for insufficient-funds and timeout declines, aligned to typical salary/settlement windows.', status: 'active', channelPriority: ['upi', 'card', 'netbanking'], triggerFailureReasons: ['insufficient-funds', 'timeout', 'bank-decline'], maxRetries: 4, successRate: 0.81, paymentsCovered: 412, updatedAt: '2026-08-27T00:00:00+05:30' },
  { id: 'S-02', name: 'Mandate renewal flow', description: 'Detects mandates nearing expiry and sends renewal prompts before the next debit cycle.', status: 'active', channelPriority: ['mandate'], triggerFailureReasons: ['mandate-expired'], maxRetries: 2, successRate: 0.74, paymentsCovered: 138, updatedAt: '2026-08-25T00:00:00+05:30' },
  { id: 'S-03', name: 'Channel fallback cascade', description: 'Falls back from card to UPI to netbanking when the primary channel repeatedly declines.', status: 'active', channelPriority: ['card', 'upi', 'netbanking', 'wallet'], triggerFailureReasons: ['issuer-decline', 'bank-decline', 'processor-error'], maxRetries: 3, successRate: 0.68, paymentsCovered: 256, updatedAt: '2026-08-22T00:00:00+05:30' },
  { id: 'S-04', name: 'High-value human review', description: 'Routes any recovery above the configured approval threshold to a human before retrying.', status: 'active', channelPriority: ['card', 'mandate'], triggerFailureReasons: ['insufficient-funds', 'processor-error'], maxRetries: 1, successRate: 0.89, paymentsCovered: 64, updatedAt: '2026-08-20T00:00:00+05:30' },
  { id: 'S-05', name: 'Fraud-risk containment', description: 'Immediately holds and blocks retries on payments flagged for suspected fraud or lost/stolen instruments.', status: 'active', channelPriority: [], triggerFailureReasons: ['fraud-suspected', 'card-lost'], maxRetries: 0, successRate: 0.12, paymentsCovered: 29, updatedAt: '2026-08-18T00:00:00+05:30' },
  { id: 'S-06', name: 'Dormant instrument refresh', description: 'Experimental: prompts customers to update expired cards before attempting recovery.', status: 'draft', channelPriority: ['card'], triggerFailureReasons: ['card-expired', 'invalid-account'], maxRetries: 2, successRate: 0.41, paymentsCovered: 18, updatedAt: '2026-08-14T00:00:00+05:30' },
]

export const demoBatches: Batch[] = [
  { id: 'B-2201', name: 'Weekend soft-decline sweep', strategyId: 'S-01', status: 'completed', paymentCount: 184, totalAmount: 6_420_000, recoveredAmount: 5_180_000, progress: 1, startedAt: '2026-08-29T06:00:00+05:30', completedAt: '2026-08-29T09:40:00+05:30' },
  { id: 'B-2202', name: 'Mandate expiry — August cohort', strategyId: 'S-02', status: 'running', paymentCount: 96, totalAmount: 2_140_000, recoveredAmount: 940_000, progress: 0.58, startedAt: '2026-08-30T05:00:00+05:30' },
  { id: 'B-2203', name: 'Card channel fallback batch', strategyId: 'S-03', status: 'running', paymentCount: 62, totalAmount: 1_860_000, recoveredAmount: 610_000, progress: 0.34, startedAt: '2026-08-30T07:00:00+05:30' },
  { id: 'B-2204', name: 'Enterprise high-value review', strategyId: 'S-04', status: 'scheduled', paymentCount: 11, totalAmount: 1_420_000, recoveredAmount: 0, progress: 0, startedAt: '2026-08-30T14:00:00+05:30' },
  { id: 'B-2205', name: 'Expired card refresh pilot', strategyId: 'S-06', status: 'paused', paymentCount: 18, totalAmount: 312_000, recoveredAmount: 64_000, progress: 0.2, startedAt: '2026-08-28T10:00:00+05:30' },
]

// ---------------------------------------------------------------------------
// AI agent
// ---------------------------------------------------------------------------

export const demoAgentDecisions: AgentDecision[] = [
  { id: 'AD-3001', paymentId: 'P10234', summary: 'Retry immediately via UPI', reasoning: ['Failure reason is a soft decline, historically resolves within minutes.', 'Customer has a 92% recovery rate on UPI over the last 90 days.', 'No policy restrictions apply at this amount.'], confidence: 0.92, recommendedAction: 'retry', alternativeActions: ['smart-retry'], requiresApproval: false, policyId: 'PL-01', createdAt: '2026-08-30T09:12:10+05:30' },
  { id: 'AD-3002', paymentId: 'P10481', summary: 'Escalate to human approval', reasoning: ['Amount (\u20b918,500) exceeds the \u20b910,000 auto-retry threshold.', 'Risk level is high with a prior insufficient-funds decline.', 'Policy PL-02 requires sign-off above threshold for high-risk payments.'], confidence: 0.88, recommendedAction: 'human-approval', alternativeActions: ['smart-retry', 'hold'], requiresApproval: true, policyId: 'PL-02', createdAt: '2026-08-30T08:41:40+05:30' },
  { id: 'AD-3003', paymentId: 'P11090', summary: 'Hold — do not retry', reasoning: ['Failure reason indicates the card was reported lost.', 'Retrying a lost instrument risks a chargeback and violates safety policy.', 'Recommends prompting customer for a new payment method instead.'], confidence: 0.90, recommendedAction: 'hold', alternativeActions: ['update-payment-method'], requiresApproval: false, policyId: 'PL-05', createdAt: '2026-08-30T07:30:20+05:30' },
  { id: 'AD-3004', paymentId: 'P11178', summary: 'Switch to UPI after repeated card declines', reasoning: ['Card channel has declined twice with issuer-decline.', 'Customer has an active UPI handle with a 96% success rate.', 'Switching channel avoids further issuer risk scoring impact.'], confidence: 0.85, recommendedAction: 'switch-channel', alternativeActions: ['smart-retry', 'human-approval'], requiresApproval: false, policyId: 'PL-03', createdAt: '2026-08-30T06:52:30+05:30' },
  { id: 'AD-3005', paymentId: 'P11276', summary: 'Block and flag for fraud review', reasoning: ['Failure reason flagged as suspected fraud by the issuer.', 'Customer risk profile is critical with recent chargebacks.', 'Policy PL-05 mandates an immediate hold on fraud signals.'], confidence: 0.93, recommendedAction: 'hold', alternativeActions: [], requiresApproval: true, policyId: 'PL-05', createdAt: '2026-08-30T05:15:10+05:30' },
]

export const demoAgentEvents: AgentEvent[] = [
  { id: 'AE-01', kind: 'action', title: 'Retried payment P10234', description: 'Smart retry executed over UPI 2 minutes after decline.', paymentId: 'P10234', confidence: 0.92, timestamp: '2026-08-30T09:12:10+05:30' },
  { id: 'AE-02', kind: 'escalation', title: 'Escalated P10481 for approval', description: 'Amount exceeds auto-retry threshold; routed to human approvals queue.', paymentId: 'P10481', confidence: 0.88, timestamp: '2026-08-30T08:41:40+05:30' },
  { id: 'AE-03', kind: 'analysis', title: 'Detected UPI failure anomaly', description: 'UPI decline rate increased 3.4% over the trailing hour across the merchant portfolio.', confidence: 0.79, timestamp: '2026-08-30T08:17:10+05:30' },
  { id: 'AE-04', kind: 'decision', title: 'Held retries on P11090', description: 'Card reported lost; all further retry attempts blocked per policy.', paymentId: 'P11090', confidence: 0.90, timestamp: '2026-08-30T07:30:20+05:30' },
  { id: 'AE-05', kind: 'decision', title: 'Switched channel for P11178', description: 'Card issuer declined twice; agent switched the next attempt to UPI.', paymentId: 'P11178', confidence: 0.85, timestamp: '2026-08-30T06:52:30+05:30' },
  { id: 'AE-06', kind: 'learning', title: 'Updated retry timing model', description: 'Adjusted smart-retry backoff window for netbanking timeouts based on the last 500 outcomes.', confidence: 0.72, timestamp: '2026-08-30T06:00:00+05:30' },
  { id: 'AE-07', kind: 'escalation', title: 'Flagged P11276 for fraud review', description: 'Suspected fraud signal from issuer; payment held and routed to governance review.', paymentId: 'P11276', confidence: 0.93, timestamp: '2026-08-30T05:15:10+05:30' },
  { id: 'AE-08', kind: 'analysis', title: 'Batch B-2202 progressing', description: 'Mandate renewal batch at 58% completion with a 74% recovery rate so far.', confidence: 0.81, timestamp: '2026-08-30T05:00:00+05:30' },
  { id: 'AE-09', kind: 'action', title: 'Sent mandate renewal reminder', description: 'Reminder sent to Amit Patil ahead of mandate expiry on P10982.', paymentId: 'P10982', confidence: 0.83, timestamp: '2026-08-30T08:05:30+05:30' },
  { id: 'AE-10', kind: 'learning', title: 'Retrained recovery-probability model', description: 'Nightly retrain incorporated 1,240 new outcomes; validation accuracy held at 91.2%.', confidence: 0.91, timestamp: '2026-08-30T02:00:00+05:30' },
]

export const demoPredictions: Prediction[] = [
  { id: 'PR-01', paymentId: 'P10481', modelVersion: 'recovery-gbm-v4.2', recoveryProbability: 0.61, confidence: 0.88, factors: ['Prior insufficient-funds decline', 'High-value transaction', 'Customer has 3 successful recoveries in last 90 days'], generatedAt: '2026-08-30T08:41:05+05:30' },
  { id: 'PR-02', paymentId: 'P10982', modelVersion: 'recovery-gbm-v4.2', recoveryProbability: 0.78, confidence: 0.83, factors: ['Mandate expiring, not yet lapsed', 'Customer has 2 active mandates in good standing'], generatedAt: '2026-08-30T08:05:05+05:30' },
  { id: 'PR-03', paymentId: 'P11178', modelVersion: 'recovery-gbm-v4.2', recoveryProbability: 0.58, confidence: 0.85, factors: ['Repeated issuer decline on card', 'Strong UPI success history'], generatedAt: '2026-08-30T06:52:05+05:30' },
  { id: 'PR-04', paymentId: 'P11249', modelVersion: 'recovery-gbm-v4.2', recoveryProbability: 0.66, confidence: 0.87, factors: ['Enterprise account with high LTV', 'Large amount above auto-approval threshold'], generatedAt: '2026-08-30T05:47:05+05:30' },
  { id: 'PR-05', paymentId: 'P11355', modelVersion: 'recovery-gbm-v4.2', recoveryProbability: 0.31, confidence: 0.86, factors: ['Invalid account details on file', 'Two prior failed recovery attempts'], generatedAt: '2026-08-30T03:55:05+05:30' },
]

export const demoInsights: RecoveryInsight[] = [
  { id: 'IN-01', title: 'UPI recoveries outperforming card by 18pp', description: 'Over the last 7 days, UPI retries recovered 89% of attempts versus 71% for card retries.', impact: 'high', category: 'trend', metricDelta: 0.18, createdAt: '2026-08-30T06:00:00+05:30' },
  { id: 'IN-02', title: 'Mandate expiries rising ahead of month-end', description: 'Mandate-expired failures are up 22% week-over-week as more NACH mandates approach renewal.', impact: 'medium', category: 'anomaly', metricDelta: 0.22, createdAt: '2026-08-29T18:00:00+05:30' },
  { id: 'IN-03', title: 'Channel fallback cascade lifting SME recovery rate', description: 'SME segment recovery rate improved 9pp since the card→UPI→netbanking cascade went live.', impact: 'high', category: 'opportunity', metricDelta: 0.09, createdAt: '2026-08-28T12:00:00+05:30' },
  { id: 'IN-04', title: 'Fraud-flagged volume ticking up in card channel', description: 'Suspected-fraud declines on card payments rose from 0.4% to 0.9% of volume this week.', impact: 'medium', category: 'risk', metricDelta: 0.5, createdAt: '2026-08-30T05:30:00+05:30' },
]

// ---------------------------------------------------------------------------
// Governance — policies, approvals, audit trail
// ---------------------------------------------------------------------------

export const demoPolicies: Policy[] = [
  { id: 'PL-01', name: 'Standard auto-retry', description: 'Allows the agent to retry soft declines automatically without human sign-off.', status: 'active', category: 'retry-limit', rule: 'Auto-retry up to 4 times for insufficient-funds, timeout, or bank-decline reasons.', threshold: 4, updatedAt: '2026-08-20T00:00:00+05:30', updatedBy: 'human' },
  { id: 'PL-02', name: 'High-value approval threshold', description: 'Requires human approval for any recovery attempt above the configured amount.', status: 'active', category: 'approval-threshold', rule: 'Route to human approval when amount exceeds \u20b910,000 and risk is medium or higher.', threshold: 10_000, updatedAt: '2026-08-18T00:00:00+05:30', updatedBy: 'human' },
  { id: 'PL-03', name: 'Channel fallback permissions', description: 'Defines which channels the agent may switch to automatically.', status: 'active', category: 'channel-restriction', rule: 'Card may fall back to UPI or netbanking; mandate may not fall back automatically.', updatedAt: '2026-08-15T00:00:00+05:30', updatedBy: 'human' },
  { id: 'PL-04', name: 'Enterprise account guardrail', description: 'All enterprise-segment recoveries above \u20b950,000 require approval regardless of confidence.', status: 'active', category: 'approval-threshold', rule: 'Route to human approval for enterprise segment when amount exceeds \u20b950,000.', threshold: 50_000, updatedAt: '2026-08-12T00:00:00+05:30', updatedBy: 'human' },
  { id: 'PL-05', name: 'Fraud and lost-instrument hold', description: 'Immediately blocks retries when fraud or a lost/stolen instrument is suspected.', status: 'active', category: 'risk-guardrail', rule: 'Hold and escalate on fraud-suspected or card-lost failure reasons; zero auto-retries.', threshold: 0, updatedAt: '2026-08-10T00:00:00+05:30', updatedBy: 'human' },
  { id: 'PL-06', name: 'Expired-instrument refresh (draft)', description: 'Proposed policy to prompt for updated card details before attempting recovery.', status: 'draft', category: 'compliance', rule: 'For card-expired or invalid-account reasons, request updated details before any retry.', updatedAt: '2026-08-05T00:00:00+05:30', updatedBy: 'ai-agent' },
]

export const demoApprovals: Approval[] = [
  { id: 'AP-01', paymentId: 'P10481', amount: 18_500, reason: 'Amount exceeds \u20b910,000 auto-retry threshold at high risk.', riskLevel: 'high', requestedBy: 'ai-agent', status: 'pending', requestedAt: '2026-08-30T08:41:40+05:30' },
  { id: 'AP-02', paymentId: 'P11249', amount: 128_000, reason: 'Enterprise account above \u20b950,000 guardrail.', riskLevel: 'high', requestedBy: 'ai-agent', status: 'pending', requestedAt: '2026-08-30T05:47:20+05:30' },
  { id: 'AP-03', paymentId: 'P11583', amount: 22_100, reason: 'Processor error with prior failed attempt.', riskLevel: 'high', requestedBy: 'ai-agent', status: 'pending', requestedAt: '2026-08-29T23:38:20+05:30' },
  { id: 'AP-04', paymentId: 'P11276', amount: 3_150, reason: 'Suspected fraud signal from issuer.', riskLevel: 'critical', requestedBy: 'ai-agent', status: 'approved', requestedAt: '2026-08-30T05:15:20+05:30', decidedAt: '2026-08-30T05:22:00+05:30', decidedBy: 'human' },
  { id: 'AP-05', paymentId: 'P11090', amount: 12_300, reason: 'Card reported lost; hold requested before write-off.', riskLevel: 'critical', requestedBy: 'ai-agent', status: 'approved', requestedAt: '2026-08-30T07:30:30+05:30', decidedAt: '2026-08-30T07:38:00+05:30', decidedBy: 'human' },
  { id: 'AP-06', paymentId: 'P11549', amount: 5_600, reason: 'Fourth failed attempt; recommend write-off.', riskLevel: 'critical', requestedBy: 'ai-agent', status: 'rejected', requestedAt: '2026-08-30T01:10:20+05:30', decidedAt: '2026-08-30T01:20:00+05:30', decidedBy: 'human' },
]

export const demoAuditEvents: AuditEvent[] = [
  { id: 'A-9001', actor: 'ai-agent', action: 'Retried payment', target: 'P10234', timestamp: '09:12:04', status: 'recovered' },
  { id: 'A-9002', actor: 'ai-agent', action: 'Escalated for approval', target: 'P10481', timestamp: '08:41:22', status: 'pending-approval' },
  { id: 'A-9003', actor: 'system', action: 'Flagged anomaly', target: 'UPI channel', timestamp: '08:17:10', status: 'info' },
  { id: 'A-9004', actor: 'human', action: 'Blocked retries', target: 'P11090', timestamp: '07:31:55', status: 'blocked' },
  { id: 'A-9005', actor: 'ai-agent', action: 'Switched recovery channel', target: 'P11178', timestamp: '06:52:31', status: 'at-risk' },
  { id: 'A-9006', actor: 'ai-agent', action: 'Held payment pending fraud review', target: 'P11276', timestamp: '05:15:12', status: 'blocked' },
  { id: 'A-9007', actor: 'human', action: 'Approved high-value retry', target: 'P11276', timestamp: '05:22:00', status: 'info' },
  { id: 'A-9008', actor: 'system', action: 'Started batch', target: 'B-2203', timestamp: '07:00:00', status: 'info' },
  { id: 'A-9009', actor: 'ai-agent', action: 'Sent mandate renewal reminder', target: 'P10982', timestamp: '08:05:30', status: 'at-risk' },
  { id: 'A-9010', actor: 'human', action: 'Rejected write-off request', target: 'P11549', timestamp: '01:20:00', status: 'failed' },
  { id: 'A-9011', actor: 'ai-agent', action: 'Retrained recovery-probability model', target: 'recovery-gbm-v4.2', timestamp: '02:00:00', status: 'info' },
  { id: 'A-9012', actor: 'system', action: 'Completed batch', target: 'B-2201', timestamp: '2026-08-29 09:40:00', status: 'info' },
]

// ---------------------------------------------------------------------------
// Shell support — notifications & global search
// ---------------------------------------------------------------------------

export const demoNotifications: AppNotification[] = [
  { id: 'N-01', kind: 'success', title: 'Payment P10234 recovered', detail: '\u20b92,499 recovered via UPI retry', timestamp: '2m ago', unread: true },
  { id: 'N-02', kind: 'warning', title: 'Human approval required', detail: '\u20b918,500 transaction on P10481', timestamp: '9m ago', unread: true },
  { id: 'N-03', kind: 'danger', title: 'Payment failure anomaly detected', detail: 'UPI failure rate increased 3.4%', timestamp: '24m ago', unread: true },
  { id: 'N-04', kind: 'ai', title: 'Recovery strategy updated', detail: 'Agent adjusted retry timing for cards', timestamp: '1h ago', unread: false },
  { id: 'N-05', kind: 'warning', title: 'Fraud signal flagged', detail: 'P11276 held pending review', timestamp: '2h ago', unread: false },
]

export const demoSearchResults: SearchResult[] = [
  { id: 'P10234', type: 'payment', title: 'P10234', subtitle: 'Recovered \u00b7 \u20b92,499 \u00b7 Rahul Sharma' },
  { id: 'P10481', type: 'payment', title: 'P10481', subtitle: 'Pending approval \u00b7 \u20b918,500 \u00b7 Priya Deshmukh' },
  { id: 'P11249', type: 'payment', title: 'P11249', subtitle: 'Pending approval \u00b7 \u20b91,28,000 \u00b7 Karan Mehta' },
  { id: 'C-4192', type: 'customer', title: 'Rahul Sharma', subtitle: 'Customer \u00b7 LTV \u20b91.84L \u00b7 2 mandates' },
  { id: 'C-4233', type: 'customer', title: 'Priya Deshmukh', subtitle: 'Customer \u00b7 LTV \u20b93.11L \u00b7 3 mandates' },
  { id: 'A-9001', type: 'audit', title: 'Retried payment P10234', subtitle: 'Audit \u00b7 AI Agent \u00b7 09:12:04' },
]

/** Headline metrics for the Overview command center. */
export const demoMetrics = {
  revenueAtRisk: 8_240_000,
  recoverableRevenue: 5_200_000,
  revenueRecovered: 3_140_000,
  recoveryRate: 0.604,
  recoveryRateDelta: 0.061,
  pendingApprovals: 3,
  activeAgentActions: 5,
}

/** Secondary command-center metrics — operational volume rather than revenue. */
export const demoSecondaryMetrics: SecondaryMetrics = {
  aiActionsExecuted: 5_184,
  humanEscalations: 342,
  safetyBlocks: 47,
  averageRecoveryTimeMinutes: 18,
}

// ---------------------------------------------------------------------------
// Command-center analytics — all figures below are synthetic and
// deterministic (no Math.random / Date.now) so server and client render
// identically. They model plausible daily flow and composition; they are
// independent of the point-in-time snapshot in `demoMetrics` above.
// ---------------------------------------------------------------------------

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TODAY_ISO = '2026-08-30'

function shiftDayUTC(baseIso: string, deltaDays: number): { iso: string; label: string } {
  const d = new Date(`${baseIso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + deltaDays)
  const iso = d.toISOString().slice(0, 10)
  return { iso, label: `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCDate()}` }
}

/** Deterministic pseudo-random in [0, 1) — pure function of the seed, stable across server/client. */
function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** 90 days of daily revenue flow ending today, with mild growth + weekly seasonality. */
export const demoRevenueTrend90d: RevenueTrendPoint[] = Array.from({ length: 90 }, (_, i) => {
  const dayIndex = i - 89 // -89 .. 0
  const { iso, label } = shiftDayUTC(TODAY_ISO, dayIndex)
  const progress = i / 89 // 0 → 1 across the window
  const weekly = Math.sin((i / 7) * Math.PI * 2) * 0.08
  const noise = (seededNoise(i + 1) - 0.5) * 0.1
  const baseAtRisk = 92_000 + progress * 38_000
  const atRisk = Math.round(baseAtRisk * (1 + weekly + noise))
  const recoverableRatio = 0.6 + progress * 0.04 + (seededNoise(i + 200) - 0.5) * 0.03
  const recoverable = Math.round(atRisk * recoverableRatio)
  const recoveryRateForDay = 0.52 + progress * 0.14 + (seededNoise(i + 400) - 0.5) * 0.04
  const recovered = Math.round(recoverable * Math.min(0.82, Math.max(0.4, recoveryRateForDay)))
  return { date: iso, label, atRisk, recoverable, recovered }
})

/** Failure reasons by share of total failure volume, with revenue impact and recoverability. */
export const demoFailureBreakdown: FailureReasonBreakdown[] = [
  { reason: 'bank-decline', label: 'Bank decline', share: 0.38, revenueImpact: 3_130_000, recoverability: 'high', recoveryRate: 0.83 },
  { reason: 'insufficient-funds', label: 'Insufficient funds', share: 0.22, revenueImpact: 1_810_000, recoverability: 'medium', recoveryRate: 0.58 },
  { reason: 'timeout', label: 'Gateway timeout', share: 0.17, revenueImpact: 1_400_000, recoverability: 'high', recoveryRate: 0.79 },
  { reason: 'network-error', label: 'Network error', share: 0.11, revenueImpact: 900_000, recoverability: 'high', recoveryRate: 0.81 },
  { reason: 'card-expired', label: 'Card expired', share: 0.07, revenueImpact: 580_000, recoverability: 'low', recoveryRate: 0.21 },
  { reason: 'other', label: 'Other', share: 0.05, revenueImpact: 420_000, recoverability: 'low', recoveryRate: 0.19 },
]

/** Recovery performance for the four customer-facing payment methods. */
export const demoChannelPerformance: ChannelPerformance[] = [
  { channel: 'upi', label: 'UPI', failureRate: 0.18, recoveryRate: 0.89, revenueRecovered: 1_240_000 },
  { channel: 'card', label: 'Cards', failureRate: 0.34, recoveryRate: 0.71, revenueRecovered: 1_860_000 },
  { channel: 'netbanking', label: 'Net banking', failureRate: 0.29, recoveryRate: 0.63, revenueRecovered: 640_000 },
  { channel: 'wallet', label: 'Wallets', failureRate: 0.15, recoveryRate: 0.82, revenueRecovered: 210_000 },
]

/** How each AI intervention type performs once selected by the agent. */
export const demoInterventionPerformance: InterventionPerformance[] = [
  { action: 'retry', label: 'Retry', recoveryRate: 0.81, revenueRecovered: 2_340_000, risk: 'low' },
  { action: 'send-reminder', label: 'Reminder', recoveryRate: 0.64, revenueRecovered: 780_000, risk: 'low' },
  { action: 'escalate', label: 'Escalation', recoveryRate: 0.72, revenueRecovered: 1_020_000, risk: 'medium' },
]

/** Histogram of the model's recovery-probability estimates across all 10,000 at-risk payments. */
export const demoProbabilityDistribution: ProbabilityBucket[] = [
  { bucketLabel: '0–10%', paymentCount: 180 },
  { bucketLabel: '10–20%', paymentCount: 320 },
  { bucketLabel: '20–30%', paymentCount: 540 },
  { bucketLabel: '30–40%', paymentCount: 780 },
  { bucketLabel: '40–50%', paymentCount: 1_120 },
  { bucketLabel: '50–60%', paymentCount: 1_480 },
  { bucketLabel: '60–70%', paymentCount: 1_860 },
  { bucketLabel: '70–80%', paymentCount: 1_640 },
  { bucketLabel: '80–90%', paymentCount: 1_380 },
  { bucketLabel: '90–100%', paymentCount: 700 },
]

/** Model-expected vs. actually-recovered revenue over the last six weeks. */
export const demoExpectedVsActual: ExpectedVsActualPoint[] = [
  { label: 'Wk 1', expected: 4_200_000, actual: 3_980_000 },
  { label: 'Wk 2', expected: 4_450_000, actual: 4_510_000 },
  { label: 'Wk 3', expected: 4_700_000, actual: 4_360_000 },
  { label: 'Wk 4', expected: 4_900_000, actual: 5_120_000 },
  { label: 'Wk 5', expected: 5_050_000, actual: 4_890_000 },
  { label: 'Wk 6', expected: 5_200_000, actual: 5_310_000 },
]

/** Revenue at risk split by customer segment — sums to demoMetrics.revenueAtRisk. */
export const demoSegmentRisk: SegmentRisk[] = [
  { segment: 'consumer', label: 'Consumer', revenueAtRisk: 2_860_000, paymentCount: 6_200 },
  { segment: 'sme', label: 'SME', revenueAtRisk: 3_180_000, paymentCount: 2_900 },
  { segment: 'enterprise', label: 'Enterprise', revenueAtRisk: 2_200_000, paymentCount: 900 },
]

/** Next-24h recovery forecast — trailing 3 actual days for context, then a projected curve. */
export const demoRecoveryForecast: RecoveryForecast = {
  next24hAmount: 840_000,
  confidence: 0.86,
  series: [
    { label: '-6h', projected: 0, low: 0, high: 0, isForecast: false },
    { label: '-3h', projected: 0, low: 0, high: 0, isForecast: false },
    { label: 'Now', projected: 0, low: 0, high: 0, isForecast: false },
    { label: '+3h', projected: 95_000, low: 80_000, high: 110_000, isForecast: true },
    { label: '+6h', projected: 205_000, low: 175_000, high: 235_000, isForecast: true },
    { label: '+9h', projected: 330_000, low: 280_000, high: 380_000, isForecast: true },
    { label: '+12h', projected: 460_000, low: 390_000, high: 530_000, isForecast: true },
    { label: '+15h', projected: 590_000, low: 500_000, high: 680_000, isForecast: true },
    { label: '+18h', projected: 700_000, low: 595_000, high: 805_000, isForecast: true },
    { label: '+21h', projected: 790_000, low: 670_000, high: 910_000, isForecast: true },
    { label: '+24h', projected: 840_000, low: 715_000, high: 965_000, isForecast: true },
  ],
}

export const demoEarlyWarnings: EarlyWarning[] = [
  {
    id: 'EW-01',
    title: 'UPI failure anomaly',
    metricLabel: 'UPI failure rate',
    fromValue: '4.2%',
    toValue: '9.8%',
    revenueAtRisk: 670_000,
    cause: 'Temporary payment route degradation with one UPI PSP.',
    recommendedAction: 'Investigate the affected payment route before it widens.',
    severity: 'high',
    confidence: 0.83,
  },
  {
    id: 'EW-02',
    title: 'Mandate expiry spike',
    metricLabel: 'Mandate-expired failures',
    fromValue: '6.1%',
    toValue: '8.3%',
    revenueAtRisk: 310_000,
    cause: 'Cluster of NACH mandates due for month-end renewal.',
    recommendedAction: 'Prioritize renewal reminders for the affected cohort.',
    severity: 'medium',
    confidence: 0.77,
  },
]

export const demoRootCauses: RootCauseInsight[] = [
  { id: 'RC-01', reason: 'bank-decline', label: 'Bank decline', frequency: 3_800, revenueImpact: 3_130_000, recoverability: 'high', recommendedIntervention: 'smart-retry' },
  { id: 'RC-02', reason: 'insufficient-funds', label: 'Insufficient funds', frequency: 2_200, revenueImpact: 1_810_000, recoverability: 'medium', recommendedIntervention: 'smart-retry' },
  { id: 'RC-03', reason: 'timeout', label: 'Gateway timeout', frequency: 1_700, revenueImpact: 1_400_000, recoverability: 'high', recommendedIntervention: 'retry' },
  { id: 'RC-04', reason: 'network-error', label: 'Network error', frequency: 1_100, revenueImpact: 900_000, recoverability: 'high', recommendedIntervention: 'retry' },
  { id: 'RC-05', reason: 'card-expired', label: 'Card expired', frequency: 700, revenueImpact: 580_000, recoverability: 'low', recommendedIntervention: 'update-payment-method' },
]

/** The recovery funnel — from every at-risk payment down to revenue actually recovered. */
export const demoRecoveryFunnel: RecoveryFunnelStage[] = [
  {
    key: 'at-risk',
    label: 'Revenue at risk',
    paymentCount: 10_000,
    revenue: 8_240_000,
  },
  {
    key: 'identified-recoverable',
    label: 'Identified as recoverable',
    paymentCount: 6_240,
    revenue: 5_200_000,
    conversionFromPrevious: 0.624,
    topFailureReasons: ['Bank decline', 'Insufficient funds', 'Gateway timeout'],
    strategy: 'Model flags payments above the recoverability threshold for action.',
  },
  {
    key: 'actions-initiated',
    label: 'Actions initiated',
    paymentCount: 5_184,
    revenue: 4_320_000,
    conversionFromPrevious: 0.831,
    topFailureReasons: ['Bank decline', 'Timeout', 'Network error'],
    strategy: 'Soft-decline smart retry, mandate renewal flow, channel fallback cascade.',
  },
  {
    key: 'recovered',
    label: 'Successfully recovered',
    paymentCount: 3_842,
    revenue: 3_140_000,
    conversionFromPrevious: 0.741,
    topFailureReasons: ['Bank decline', 'Insufficient funds'],
    strategy: 'Retry and smart-retry accounted for the majority of recoveries.',
  },
]
