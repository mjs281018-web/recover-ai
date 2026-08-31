import { cn } from '@/lib/utils'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { RiskLevel } from '@/types'

type StatusKey =
  | 'success'
  | 'warning'
  | 'critical'
  | 'pending'
  | 'processing'
  | 'blocked'
  | 'ai-active'
  | 'human-approval'
  | 'recovered'
  | 'failed'
  | 'at-risk'
  | 'in-progress'

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; variant: BadgeProps['variant']; dot: string; pulse?: boolean }
> = {
  success: { label: 'Success', variant: 'success', dot: 'bg-success' },
  recovered: { label: 'Recovered', variant: 'success', dot: 'bg-success' },
  warning: { label: 'Warning', variant: 'warning', dot: 'bg-warning' },
  pending: { label: 'Pending', variant: 'warning', dot: 'bg-warning' },
  'human-approval': { label: 'Human approval', variant: 'warning', dot: 'bg-warning' },
  'at-risk': { label: 'At risk', variant: 'warning', dot: 'bg-warning' },
  critical: { label: 'Critical', variant: 'danger', dot: 'bg-danger' },
  failed: { label: 'Failed', variant: 'danger', dot: 'bg-danger' },
  blocked: { label: 'Blocked', variant: 'danger', dot: 'bg-danger' },
  processing: { label: 'Processing', variant: 'ai', dot: 'bg-ai', pulse: true },
  'in-progress': { label: 'In progress', variant: 'ai', dot: 'bg-ai', pulse: true },
  'ai-active': { label: 'AI active', variant: 'ai', dot: 'bg-ai', pulse: true },
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusKey
  label?: string
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant={config.variant} className={className}>
      <span className="relative flex size-1.5">
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex size-full animate-ping rounded-full opacity-60',
              config.dot,
            )}
          />
        )}
        <span className={cn('relative inline-flex size-1.5 rounded-full', config.dot)} />
      </span>
      {label ?? config.label}
    </Badge>
  )
}

const RISK_CONFIG: Record<RiskLevel, { label: string; variant: BadgeProps['variant'] }> = {
  low: { label: 'Low risk', variant: 'success' },
  medium: { label: 'Medium risk', variant: 'warning' },
  high: { label: 'High risk', variant: 'danger' },
  critical: { label: 'Critical', variant: 'danger' },
}

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  const config = RISK_CONFIG[risk]
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export type { StatusKey }
