import { cn } from '@/lib/utils'

export function AutonomyStatusIndicator({
  active = true,
  className,
}: {
  active?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase',
        active ? 'border-success/25 bg-success-muted text-success' : 'border-border-strong bg-surface text-muted-foreground',
        className,
      )}
    >
      <span className="relative flex size-2">
        {active && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />}
        <span className={cn('relative inline-flex size-2 rounded-full', active ? 'bg-success' : 'bg-muted-foreground')} />
      </span>
      {active ? 'Autonomous recovery active' : 'Autonomous recovery paused'}
    </div>
  )
}
