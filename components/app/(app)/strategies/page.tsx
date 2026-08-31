import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatPercent } from '@/lib/format'
import { strategyStatusKey } from '@/lib/status'
import { listStrategies } from '@/services/recovery-service'

export default async function StrategiesPage() {
  const strategies = await listStrategies()

  return (
    <PageContainer>
      <SectionHeader
        title="Recovery Strategies"
        description="Retry logic and playbooks the agent chooses between based on failure reason, channel, and risk."
        actions={<Badge variant="neutral">{strategies.length} strategies</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {strategies.map((strategy) => {
          const status = strategyStatusKey(strategy.status)
          return (
            <Card key={strategy.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1">
                  <CardTitle>{strategy.name}</CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </div>
                <StatusBadge status={status.key} label={status.label} className="shrink-0" />
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-0 text-sm">
                <div>
                  <span className="text-muted-foreground">Success rate </span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatPercent(strategy.successRate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payments covered </span>
                  <span className="font-medium tabular-nums text-foreground">{strategy.paymentsCovered}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max retries </span>
                  <span className="font-medium tabular-nums text-foreground">{strategy.maxRetries}</span>
                </div>
                {strategy.channelPriority.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Channels</span>
                    {strategy.channelPriority.map((c) => (
                      <Badge key={c} variant="neutral" className="capitalize">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </PageContainer>
  )
}
