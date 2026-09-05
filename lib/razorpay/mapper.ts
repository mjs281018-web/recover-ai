import type {
  CustomerSegment,
  FailureReason,
  Payment,
  RecoveryActionType,
  RecoveryChannel,
  RiskLevel,
} from '@/types'

export interface RazorpayPaymentEntity {
  id: string
  amount: number
  currency: string
  status: string
  method?: string
  email?: string
  contact?: string
  description?: string
  order_id?: string | null
  error_code?: string | null
  error_description?: string | null
  notes?: Record<string, string>
  created_at?: number
}

export interface RazorpayWebhookPayload {
  entity: string
  account_id?: string
  event: string
  contains?: string[]
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity
    }
  }
  created_at?: number
}

function mapChannel(method?: string): RecoveryChannel {
  switch (method?.toLowerCase()) {
    case 'upi':
      return 'upi'

    case 'netbanking':
      return 'netbanking'

    case 'wallet':
      return 'wallet'

    case 'emandate':
    case 'mandate':
    case 'nach':
      return 'mandate'

    case 'card':
    default:
      return 'card'
  }
}

function mapFailureReason(
  errorCode?: string | null,
  errorDescription?: string | null,
): FailureReason {
  const text = `${errorCode ?? ''} ${errorDescription ?? ''}`.toLowerCase()

  if (
    text.includes('insufficient') ||
    text.includes('low_balance') ||
    text.includes('balance')
  ) {
    return 'insufficient-funds'
  }

  if (text.includes('timeout')) {
    return 'timeout'
  }

  if (
    text.includes('expired') ||
    text.includes('expiry')
  ) {
    return 'card-expired'
  }

  if (
    text.includes('mandate') ||
    text.includes('nach')
  ) {
    return 'mandate-expired'
  }

  if (
    text.includes('lost') ||
    text.includes('stolen')
  ) {
    return 'card-lost'
  }

  if (
    text.includes('fraud') ||
    text.includes('risk') ||
    text.includes('blacklist')
  ) {
    return 'fraud-suspected'
  }

  if (
    text.includes('invalid') &&
    text.includes('account')
  ) {
    return 'invalid-account'
  }

  if (
    text.includes('gateway') ||
    text.includes('processing')
  ) {
    return 'processor-error'
  }

  if (text.includes('network')) {
    return 'network-error'
  }

  if (
    text.includes('issuer') ||
    text.includes('bank') ||
    text.includes('declin')
  ) {
    return 'bank-decline'
  }

  return 'bank-decline'
}

function getRecommendedAction(
  risk: RiskLevel,
  amount: number,
  failureReason: FailureReason,
): RecoveryActionType {
  if (
    risk === 'critical' ||
    failureReason === 'fraud-suspected' ||
    failureReason === 'card-lost'
  ) {
    return 'hold'
  }

  if (amount > 10000) {
    return 'human-approval'
  }

  if (
    failureReason === 'timeout' ||
    failureReason === 'processor-error' ||
    failureReason === 'network-error'
  ) {
    return 'switch-channel'
  }

  return 'smart-retry'
}

export function mapRazorpayEventToPayment(
  payload: RazorpayWebhookPayload,
  eventId: string,
): Payment | undefined {
  const entity = payload.payload?.payment?.entity

  if (!entity?.id) {
    return undefined
  }

  const amount = Math.round(entity.amount / 100)

  const channel = mapChannel(entity.method)

  const failureReason = mapFailureReason(
    entity.error_code,
    entity.error_description,
  )

  const isCritical =
    failureReason === 'fraud-suspected' ||
    failureReason === 'card-lost'

  const isHigh =
    !isCritical &&
    (amount > 10000 || failureReason === 'bank-decline')

  const risk: RiskLevel = isCritical
    ? 'critical'
    : isHigh
      ? 'high'
      : 'medium'

  const recoveryProbability = isCritical
    ? 0.05
    : isHigh
      ? 0.68
      : 0.76

  const aiConfidence = isCritical
    ? 0.95
    : isHigh
      ? 0.88
      : 0.76

  const recommendedAction = getRecommendedAction(
    risk,
    amount,
    failureReason,
  )

  const customerName =
    entity.notes?.customer_name ||
    entity.email ||
    'Razorpay Customer'

  const customerId =
    entity.email?.split('@')[0] ||
    `rzp-${entity.id.slice(-6)}`

  const paymentId =
    `RZP-${entity.id.slice(-6).toUpperCase()}`

  const timestamp = entity.created_at
    ? new Date(entity.created_at * 1000).toISOString()
    : new Date().toISOString()

  const segment: CustomerSegment =
    amount >= 50000
      ? 'enterprise'
      : 'consumer'

  return {
    id: paymentId,
    customerId,
    customerName,
    amount,
    currency: 'INR',
    status: 'at-risk',
    channel,
    paymentMethodLabel:
      entity.method || 'Razorpay payment',
    risk,
    recoveryProbability,
    aiConfidence,
    failureReason,
    recommendedAction,
    segment,
    attempts: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
