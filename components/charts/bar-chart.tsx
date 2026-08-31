'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface BarSeries {
  key: string
  label: string
  color: string
  values: number[]
}

const WIDTH = 720
const HEIGHT = 260

export function BarChart({
  labels,
  series,
  orientation = 'vertical',
  valueFormatter = (v) => String(v),
  className,
}: {
  labels: string[]
  series: BarSeries[]
  orientation?: 'vertical' | 'horizontal'
  valueFormatter?: (value: number) => string
  className?: string
}) {
  const [hover, setHover] = useState<{ group: number; series: number } | null>(null)

  if (orientation === 'horizontal') {
    return (
      <HorizontalBars labels={labels} series={series} valueFormatter={valueFormatter} className={className} />
    )
  }

  const padLeft = 44
  const padRight = 12
  const padTop = 16
  const padBottom = 28
  const innerW = WIDTH - padLeft - padRight
  const innerH = HEIGHT - padTop - padBottom
  const n = labels.length
  const seriesCount = Math.max(1, series.length)

  const maxValue = Math.max(1, ...series.flatMap((s) => s.values))
  const niceMax = maxValue * 1.15
  const yAt = (v: number) => padTop + innerH - (v / niceMax) * innerH
  const groupWidth = innerW / n
  const barGap = 4
  const barWidth = Math.max(4, (groupWidth - barGap * (seriesCount + 1)) / seriesCount)

  const ticks = Array.from({ length: 5 }, (_, i) => (niceMax / 4) * i)

  return (
    <div className={cn('relative w-full', className)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Bar chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padLeft} x2={WIDTH - padRight} y1={yAt(t)} y2={yAt(t)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={padLeft - 8} y={yAt(t) + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9}>
              {valueFormatter(t)}
            </text>
          </g>
        ))}

        {labels.map((label, gi) => {
          const groupX = padLeft + gi * groupWidth
          return (
            <g key={label + gi}>
              {series.map((s, si) => {
                const value = s.values[gi] ?? 0
                const barX = groupX + barGap + si * (barWidth + barGap)
                const barY = yAt(value)
                const isHovered = hover?.group === gi && hover?.series === si
                return (
                  <rect
                    key={s.key}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={Math.max(0, padTop + innerH - barY)}
                    rx={3}
                    fill={s.color}
                    opacity={isHovered ? 1 : hover ? 0.55 : 0.9}
                    onMouseEnter={() => setHover({ group: gi, series: si })}
                    onMouseLeave={() => setHover(null)}
                    className="transition-opacity duration-150"
                  />
                )
              })}
              <text
                x={groupX + groupWidth / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={9}
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 min-w-32 -translate-x-1/2 -translate-y-full rounded-lg border border-border-strong bg-elevated px-3 py-2 text-xs shadow-popover"
          style={{
            left: `${((padLeft + hover.group * groupWidth + groupWidth / 2) / WIDTH) * 100}%`,
            top: `${(yAt(series[hover.series].values[hover.group] ?? 0) / HEIGHT) * 100 - 3}%`,
          }}
        >
          <div className="mb-0.5 font-medium text-foreground">{labels[hover.group]}</div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: series[hover.series].color }} />
              {series[hover.series].label}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {valueFormatter(series[hover.series].values[hover.group] ?? 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function HorizontalBars({
  labels,
  series,
  valueFormatter,
  className,
}: {
  labels: string[]
  series: BarSeries[]
  valueFormatter: (v: number) => string
  className?: string
}) {
  const maxValue = Math.max(1, ...series.flatMap((s) => s.values))
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {labels.map((label, gi) => (
        <div key={label + gi} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs font-medium text-muted-foreground">{label}</span>
          <div className="flex flex-1 flex-col gap-1">
            {series.map((s) => {
              const value = s.values[gi] ?? 0
              const pct = Math.max(2, (value / maxValue) * 100)
              return (
                <div key={s.key} className="group/bar flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
                    {valueFormatter(value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
