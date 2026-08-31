import { Badge } from '@/components/ui/badge'
import { ChartFrame, ChartLegend } from '@/components/charts/chart-frame'
import { LineAreaChart } from '@/components/charts/line-area-chart'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import type { RecoveryForecast } from '@/types'

export function ForecastCard({ forecast, className }: { forecast: RecoveryForecast; className?: string }) {
  const labels = forecast.series.map((p) => p.label)
  const values = forecast.series.map((p) => p.projected)
  const low = forecast.series.map((p) => p.low)
  const high = forecast.series.map((p) => p.high)
  const firstForecastIndex = forecast.series.findIndex((p) => p.isForecast)

  return (
    <ChartFrame
      title="Recovery forecast"
      description="Projected revenue recovery over the next 24 hours, from the current moment."
      actions={<Badge variant="ai">Synthetic demo forecast</Badge>}
      className={className}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-semibold tabular-nums text-foreground">
            {formatCompactCurrency(forecast.next24hAmount)}
          </div>
          <div className="text-xs text-muted-foreground">
            Expected recovery in next 24h · {formatPercent(forecast.confidence)} model confidence
          </div>
        </div>
        <ChartLegend
          items={[
            { label: 'Confidence range', color: 'var(--color-ai)' },
            { label: 'Projected', color: 'var(--color-ai)', dashed: true },
          ]}
        />
      </div>
      <LineAreaChart
        labels={labels}
        series={[
          {
            key: 'projected',
            label: 'Projected recovery',
            color: 'var(--color-ai)',
            values,
            area: true,
            dashedFrom: firstForecastIndex,
          },
        ]}
        band={{ low, high, color: 'var(--color-ai)' }}
        valueFormatter={formatCompactCurrency}
      />
    </ChartFrame>
  )
}
