'use client'

import { useState } from 'react'
import { ChartFrame, ChartLegend } from '@/components/charts/chart-frame'
import { LineAreaChart } from '@/components/charts/line-area-chart'
import { formatCompactCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RevenueTrendPoint } from '@/types'

const RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
] as const

type RangeKey = (typeof RANGES)[number]['key']

function RangeSwitch({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => onChange(r.key)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            value === r.key
              ? 'bg-elevated text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

export function RevenueTrendChart({ trend90d, className }: { trend90d: RevenueTrendPoint[]; className?: string }) {
  const [range, setRange] = useState<RangeKey>('30d')
  const days = RANGES.find((r) => r.key === range)?.days ?? 30
  const points = trend90d.slice(-days)

  return (
    <ChartFrame
      title="Revenue recovery trend"
      description="Revenue at risk, recoverable, and recovered — daily flow, synthetic."
      actions={<RangeSwitch value={range} onChange={setRange} />}
      legend={
        <ChartLegend
          items={[
            { label: 'At risk', color: 'var(--color-danger)' },
            { label: 'Recoverable', color: 'var(--color-warning)' },
            { label: 'Recovered', color: 'var(--color-success)' },
          ]}
        />
      }
      className={className}
    >
      <LineAreaChart
        labels={points.map((p) => p.label)}
        series={[
          { key: 'atRisk', label: 'At risk', color: 'var(--color-danger)', values: points.map((p) => p.atRisk) },
          { key: 'recoverable', label: 'Recoverable', color: 'var(--color-warning)', values: points.map((p) => p.recoverable) },
          { key: 'recovered', label: 'Recovered', color: 'var(--color-success)', values: points.map((p) => p.recovered), area: true },
        ]}
        valueFormatter={formatCompactCurrency}
      />
    </ChartFrame>
  )
}
