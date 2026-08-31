import { ShieldCheck } from 'lucide-react'
import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { policyStatusKey } from '@/lib/status'
import { listPolicies } from '@/services/policy-service'

const CATEGORY_LABEL: Record<string, string> = {
  'approval-threshold': 'Approval threshold',
  'retry-limit': 'Retry limit',
  'channel-restriction': 'Channel restriction',
  'risk-guardrail': 'Risk guardrail',
  compliance: 'Compliance',
}

export default async function PolicyPage() {
  const policies = await listPolicies()

  return (
    <PageContainer>
      <SectionHeader
        title="Policy & Safety"
        description="The guardrails that decide what the agent can do autonomously and where it must ask a human first."
        actions={<Badge variant="neutral">{policies.length} policies</Badge>}
      />

      <div className="grid grid-cols-1 gap-4">
        {policies.map((policy) => {
          const status = policyStatusKey(policy.status)
          return (
            <Card key={policy.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <ShieldCheck className="size-4" />
                  </span>
                  <div className="space-y-1">
                    <CardTitle>{policy.name}</CardTitle>
                    <CardDescription>{policy.description}</CardDescription>
                  </div>
                </div>
                <StatusBadge status={status.key} label={status.label} className="shrink-0" />
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-0 text-sm">
                <Badge variant="outline">{CATEGORY_LABEL[policy.category]}</Badge>
                <span className="text-muted-foreground">{policy.rule}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </PageContainer>
  )
}
