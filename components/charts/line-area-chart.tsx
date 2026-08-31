'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

export interface LineSeries {
  key: string
  label: string
  color: string
  values: number[]
  /** Fill the area under this series down to the baseline. */
  area?: boolean
  /** Index (inclusive) from which the line renders dashed, e.g. a forecast segment. */
  dashedFrom?: number
}

interface Band {
  low: number[]
  high: number[]
  color: string
}

const WIDTH = 760
const HEIGHT = 260
const PAD_LEFT = 44
const PAD_RIGHT = 12
const PAD_TOP = 16
const PAD_BOTTOM = 28

export function LineAreaChart({
  labels,
  series,
  band,
  valueFormatter = (v) => String(v),
  yTickCount = 4,
  className,
}: {
  labels: string[]
  series: LineSeries[]
  band?: Band
  valueFormatter?: (value: number) => string
  yTickCount?: number
  className?: string
}) {
  const gradientId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM
  const n = labels.length

  const allValues = series.flatMap((s) => s.values).concat(band ? band.high : [])
  const maxValue = Math.max(1, ...allValues)
  const niceMax = Math.ceil(maxValue / (niceStep(maxValue) * yTickCount)) * niceStep(maxValue) * yTickCount || maxValue * 1.15

  const xAt = (i: number) => PAD_LEFT + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => PAD_TOP + innerH - (v / niceMax) * innerH

  /** Build an SVG path from a slice of a series' values, indices offset by `startIndex`. */
  const pathFromSlice = (values: number[], startIndex: number) =>
    values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(startIndex + i).toFixed(1)} ${yAt(v).toFixed(1)}`)
      .join(' ')

  const linePath = (values: number[]) => pathFromSlice(values, 0)

  const areaPath = (values: number[]) =>
    `${linePath(values)} L ${xAt(values.length - 1).toFixed(1)} ${(PAD_TOP + innerH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(PAD_TOP + innerH).toFixed(1)} Z`

  const bandPath = band
    ? `${band.high.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ')} ${band.low
        .map((v, i) => `L ${xAt(band.low.length - 1 - i).toFixed(1)} ${yAt(band.low[band.low.length - 1 - i]).toFixed(1)}`)
        .join(' ')} Z`
    : null

  const ticks = Array.from({ length: yTickCount + 1 }, (_, i) => (niceMax / yTickCount) * i)

  return (
    <div className={cn('relative w-full', className)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Trend chart">
        <defs>
          {series
            .filter((s) => s.area)
            .map((s) => (
              <linearGradient key={s.key} id={`${gradientId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
        </defs>

        {/* Gridlines + y-axis labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 8} y={yAt(t) + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9}>
              {valueFormatter(t)}
            </text>
          </g>
        ))}

        {/* Confidence band */}
        {bandPath && <path d={bandPath} fill={band!.color} opacity={0.14} />}

        {/* Area fills */}
        {series
          .filter((s) => s.area)
          .map((s) => (
            <path key={s.key} d={areaPath(s.values)} fill={`url(#${gradientId}-${s.key})`} />
          ))}

        {/* Lines — split into solid / dashed segments when dashedFrom is set */}
        {series.map((s) => {
          const splitAt = s.dashedFrom ?? s.values.length - 1
          const solid = s.values.slice(0, splitAt + 1)
          const dashed = s.values.slice(splitAt)
          return (
            <g key={s.key}>
              {solid.length > 1 && (
                <path d={pathFromSlice(solid, 0)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" />
              )}
              {dashed.length > 1 && (
                <path
                  d={pathFromSlice(dashed, splitAt)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              )}
            </g>
          )
        })}

        {/* Hover guideline */}
        {hoverIndex !== null && (
          <line
            x1={xAt(hoverIndex)}
            x2={xAt(hoverIndex)}
            y1={PAD_TOP}
            y2={PAD_TOP + innerH}
            stroke="var(--color-border-strong)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {/* Hover dots */}
        {hoverIndex !== null &&
          series.map((s) => (
            <circle
              key={s.key}
              cx={xAt(hoverIndex)}
              cy={yAt(s.values[hoverIndex] ?? 0)}
              r={3.5}
              fill={s.color}
              stroke="var(--color-background)"
              strokeWidth={1.5}
            />
          ))}

        {/* Hit areas for hover */}
        {labels.map((_, i) => (
          <rect
            key={i}
            x={xAt(i) - innerW / n / 2}
            y={PAD_TOP}
            width={innerW / n}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
          />
        ))}

        {/* X-axis labels — sparse to avoid crowding */}
        {labels.map((label, i) => {
          const step = Math.ceil(n / 7)
          if (i % step !== 0 && i !== n - 1) return null
          return (
            <text
              key={label + i}
              x={xAt(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={9}
            >
              {label}
            </text>
          )
        })}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 -translate-y-full rounded-lg border border-border-strong bg-elevated px-3 py-2 text-xs shadow-popover"
          style={{
            left: `${(xAt(hoverIndex) / WIDTH) * 100}%`,
            top: `${(yAt(Math.max(...series.map((s) => s.values[hoverIndex] ?? 0))) / HEIGHT) * 100 - 4}%`,
          }}
        >
          <div className="mb-1 font-medium text-foreground">{labels[hoverIndex]}</div>
          <div className="space-y-0.5">
            {series.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="font-medium tabular-nums text-foreground">
                  {valueFormatter(s.values[hoverIndex] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function niceStep(max: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(max, 1))) - 1)
  return magnitude || 1
}
