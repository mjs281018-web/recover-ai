'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Sparkline } from '@/components/charts/sparkline'
import { cn } from '@/lib/utils'

const ACCENT_STYLES = {
  default: { text: 'text-foreground', ring: 'hover:border-border-strong', chip: 'bg-muted text-muted-foreground' },
  success: { text: 'text-success', ring: 'hover:border-success/40', chip: 'bg-success-muted text-success' },
  warning: { text: 'text-warning', ring: 'hover:border-warning/40', chip: 'bg-warning-muted text-warning' },
  danger: { text: 'text-danger', ring: 'hover:border-danger/40', chip: 'bg-danger-muted text-danger' },
  ai: { text: 'text-ai', ring: 'hover:border-ai/40', chip: 'bg-ai-muted text-ai' },
} as const

/** Animates a displayed number smoothly toward `value` whenever it changes. */
function useCountUp(value: number, durationMs = 700) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    startRef.current = null
    let frame: number
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (value - from) * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(step)
      } else {
        fromRef.current = value
      }
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return display
}

export function KpiCard({
  label,
  value,
  formatValue,
  icon: Icon,
  accent = 'default',
  hint,
  delta,
  sparklineData,
  emphasis = false,
  className,
}: {
  label: string
  /** Raw numeric value — animated on change. */
  value: number
  formatValue: (v: number) => string
  icon?: React.ComponentType<{ className?: string }>
  accent?: keyof typeof ACCENT_STYLES
  hint?: string
  delta?: number
  sparklineData?: number[]
  /** Visually the strongest card on the board (Revenue Recovered). */
  emphasis?: boolean
  className?: string
}) {
  const animated = useCountUp(value)
  const styles = ACCENT_STYLES[accent]
  const positive = (delta ?? 0) >= 0
  const sparkColor =
    accent === 'success'
      ? 'var(--color-success)'
      : accent === 'warning'
        ? 'var(--color-warning)'
        : accent === 'danger'
          ? 'var(--color-danger)'
          : accent === 'ai'
            ? 'var(--color-ai)'
            : 'var(--color-primary)'

  return (
    <Card
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden p-5 transition-colors duration-200',
        styles.ring,
        emphasis && 'border-success/30 bg-gradient-to-br from-success-muted/60 via-card to-card',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', styles.chip)}>
            <Icon className="size-3.5" />
          </span>
        )}
      </div>

      <div className={cn('font-semibold tracking-tight tabular-nums', emphasis ? 'text-3xl' : 'text-2xl', 'text-foreground')}>
        {formatValue(animated)}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                positive ? 'text-success' : 'text-danger',
              )}
            >
              {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(delta * 100).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="opacity-80 transition-opacity duration-200 group-hover:opacity-100">
            <Sparkline values={sparklineData} color={sparkColor} width={72} height={26} />
          </div>
        )}
      </div>
    </Card>
  )
}
