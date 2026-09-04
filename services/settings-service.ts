/**
 * Settings service — the single source of configurable RecoverAI behavior in DEMO MODE.
 *
 * Settings values persist in the shared in-memory demo store and are read by the
 * Policy Engine and Agent Service. Changing a setting mutates the active policy
 * thresholds immediately; the change is recorded as an audit event and broadcasts
 * a runtime event so all UI surfaces refresh.
 *
 * DEMO MODE: all values are in-memory only. No real payment execution, no
 * credentials, no external API calls.
 */
import type { AuditActor } from '@/types'
import { demoPolicies } from '@/data/demo'
import { notifyRuntimeChange } from '@/lib/runtime-events'
import { recordAuditEvent } from '@/services/audit-service'
import { formatCurrency } from '@/lib/format'

export interface RecoverAISetting {
  id: string
  /** Object key used for updates */
  key: string
  name: string
  description: string
  category: 'policy' | 'recovery' | 'safety' | 'demo'
  /** Whether auto-recovery is enabled for eligible payments */
  type: 'boolean' | 'number' | 'string'
  value: boolean | number | string
  default: boolean | number | string
  /** Human-readable explanation of how this setting affects behavior */
  affects: string
  min?: number
  max?: number
  step?: number
  unit?: string
}

const settingRecords: Record<string, RecoverAISetting> = {
  highValueApprovalThreshold: {
    id: 'high-value-approval-threshold',
    key: 'highValueApprovalThreshold',
    name: 'High-value approval threshold',
    description: 'Payments above this amount with medium-or-higher risk require human approval.',
    category: 'policy',
    type: 'number',
    value: 10_000,
    default: 10_000,
    affects: 'Policy PL-02: amount > threshold + elevated risk → requiresApproval',
    min: 1_000,
    max: 500_000,
    step: 500,
    unit: 'INR',
  },
  enterpriseApprovalThreshold: {
    id: 'enterprise-approval-threshold',
    key: 'enterpriseApprovalThreshold',
    name: 'Enterprise approval threshold',
    description: 'Enterprise-segment payments above this amount require human approval regardless of confidence.',
    category: 'policy',
    type: 'number',
    value: 50_000,
    default: 50_000,
    affects: 'Policy PL-04: enterprise segment + amount > threshold → requiresApproval',
    min: 10_000,
    max: 5_000_000,
    step: 10_000,
    unit: 'INR',
  },
  maxRetryAttempts: {
    id: 'max-retry-attempts',
    key: 'maxRetryAttempts',
    name: 'Maximum retry attempts',
    description: 'Maximum number of auto-retry attempts before the agent must escalate or stop.',
    category: 'recovery',
    type: 'number',
    value: 4,
    default: 4,
    affects: 'Policy PL-01: attempts >= threshold → blocked (auto-retry limit reached)',
    min: 1,
    max: 20,
    step: 1,
    unit: 'attempts',
  },
  autoApprovalMinConfidence: {
    id: 'auto-approval-min-confidence',
    key: 'autoApprovalMinConfidence',
    name: 'Minimum AI confidence for auto-recovery',
    description: 'Payments with AI confidence at or above this threshold may execute without approval (subject to policy).',
    category: 'recovery',
    type: 'number',
    value: 0.7,
    default: 0.7,
    affects: 'Agent decision: confidence < threshold → prefer human-approval path',
    min: 0.1,
    max: 0.99,
    step: 0.05,
    unit: '',
  },
  autoRecoveryEnabled: {
    id: 'auto-recovery-enabled',
    key: 'autoRecoveryEnabled',
    name: 'Automatic recovery',
    description: 'When enabled, eligible payments enter the recovery pipeline automatically. When disabled, the agent recommends actions but does not execute.',
    category: 'recovery',
    type: 'boolean',
    value: true,
    default: true,
    affects: 'Agent auto-execution gate: disabled → all actions require manual approval',
  },
  fraudProtectionEnabled: {
    id: 'fraud-protection-enabled',
    key: 'fraudProtectionEnabled',
    name: 'Fraud protection',
    description: 'Blocks all recovery attempts on payments flagged for suspected fraud or lost instruments.',
    category: 'safety',
    type: 'boolean',
    value: true,
    default: true,
    affects: 'Policy PL-05: fraud-suspected / card-lost → always blocked (cannot be disabled)',
  },
  demoMode: {
    id: 'demo-mode',
    key: 'demoMode',
    name: 'Demo mode',
    description: 'Running in synthetic demo mode with no real payment processing.',
    category: 'demo',
    type: 'boolean',
    value: true,
    default: true,
    affects: 'Uses SyntheticPaymentProvider; no real payments are processed',
  },
}

/** Returns all current settings. */
export async function getSettings(): Promise<RecoverAISetting[]> {
  return Object.values(settingRecords).sort((a, b) =>
    a.category < b.category ? -1 : a.category > b.category ? 1 : 0,
  )
}

/** Returns a single setting by its key. */
export async function getSetting(key: string): Promise<RecoverAISetting | undefined> {
  return settingRecords[key]
}

/**
 * Updates a setting and synchronizes affected policy thresholds.
 * Records an audit event and broadcasts a runtime event.
 * Returns the updated setting, or undefined if the key is unknown.
 */
export async function updateSetting(
  key: string,
  newValue: boolean | number | string,
): Promise<RecoverAISetting | undefined> {
  const setting = settingRecords[key]
  if (!setting) return undefined

  // Safety guardrail: fraud protection can never be disabled.
  if (key === 'fraudProtectionEnabled' && newValue === false) {
    throw new Error(
      'Fraud protection cannot be disabled: safety guardrails must remain active at all times.',
    )
  }

  // Validate numeric ranges.
  if (setting.type === 'number') {
    const num = newValue as number
    if (setting.min !== undefined && num < setting.min) {
      throw new Error(`Value must be at least ${setting.min}${setting.unit ? ' ' + setting.unit : ''}.`)
    }
    if (setting.max !== undefined && num > setting.max) {
      throw new Error(`Value must be at most ${setting.max}${setting.unit ? ' ' + setting.unit : ''}.`)
    }
  }

  const oldValue = setting.value
  setting.value = newValue

  // Synchronize policy thresholds in the live demo store.
  syncPolicyThresholds()

  // Audit the configuration change.
  await recordAuditEvent({
    id: `A-CFG-${Date.now()}`,
    actor: 'human',
    action: 'Updated setting',
    target: setting.id,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'info',
  })

  // Broadcast so UI surfaces refresh.
  notifyRuntimeChange('settings-change', setting.id)

  // eslint-disable-next-line no-console
  console.info(
    `[settings] ${setting.name}: ${oldValue} → ${newValue}`,
    oldValue !== newValue ? '(changed)' : '(unchanged)',
  )

  return setting
}

/** Sync live settings into the mutable demo policy thresholds. */
function syncPolicyThresholds(): void {
  const highValue = demoPolicies.find((p) => p.id === 'PL-02')
  if (highValue) {
    highValue.threshold = settingRecords.highValueApprovalThreshold.value as number
  }

  const enterprise = demoPolicies.find((p) => p.id === 'PL-04')
  if (enterprise) {
    enterprise.threshold = settingRecords.enterpriseApprovalThreshold.value as number
  }

  const retryLimit = demoPolicies.find((p) => p.id === 'PL-01')
  if (retryLimit) {
    retryLimit.threshold = settingRecords.maxRetryAttempts.value as number
  }

  // Fraud protection always stays on — PL-05 is never deactivated.
  const fraudHold = demoPolicies.find((p) => p.id === 'PL-05')
  if (fraudHold) {
    fraudHold.status = 'active'
  }
}

/** Returns the effective high-value approval threshold (reads live setting). */
export async function getEffectiveApprovalThreshold(): Promise<number> {
  return settingRecords.highValueApprovalThreshold.value as number
}

/** Returns the effective enterprise approval threshold. */
export async function getEffectiveEnterpriseThreshold(): Promise<number> {
  return settingRecords.enterpriseApprovalThreshold.value as number
}

/** Returns the effective max retry attempts. */
export async function getEffectiveMaxRetries(): Promise<number> {
  return settingRecords.maxRetryAttempts.value as number
}

/** Returns whether auto-recovery is enabled. */
export async function isAutoRecoveryEnabled(): Promise<boolean> {
  return settingRecords.autoRecoveryEnabled.value === true
}

/** Returns whether auto-recovery is disabled (requires approval for all actions). */
export async function isAutoRecoveryDisabled(): Promise<boolean> {
  return settingRecords.autoRecoveryEnabled.value === false
}