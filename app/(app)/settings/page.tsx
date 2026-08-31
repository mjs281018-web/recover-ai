import { Database, ShieldAlert, Building2 } from 'lucide-react'
import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { demoMerchant, DEMO_BANNER } from '@/data/demo'
import { DEMO_PROVIDER_LABEL } from '@/lib/providers/payment-provider'

export default function SettingsPage() {
  return (
    <PageContainer>
      <SectionHeader
        title="Settings"
        description="Workspace configuration for the demo environment. Full configuration will be built out in a later phase."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Building2 className="size-4 text-muted-foreground" />
            Workspace
          </CardTitle>
          <CardDescription>Basic details for this demo merchant account.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Merchant</span>
            <p className="text-sm font-medium text-foreground">{demoMerchant.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Workspace</span>
            <p className="text-sm font-medium text-foreground">{demoMerchant.workspace}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Contact email</span>
            <p className="text-sm font-medium text-foreground">{demoMerchant.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Database className="size-4 text-muted-foreground" />
            Data & providers
          </CardTitle>
          <CardDescription>This workspace runs entirely on synthetic data — no real payment processing occurs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex items-center justify-between rounded-lg border border-border-strong bg-surface/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-warning" />
              <span className="text-sm font-medium text-foreground">{DEMO_BANNER}</span>
            </div>
            <Badge variant="warning">Demo mode</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border-strong bg-surface/40 px-4 py-3">
            <span className="text-sm font-medium text-foreground">{DEMO_PROVIDER_LABEL}</span>
            <Badge variant="neutral">No credentials configured</Badge>
          </div>
          <p className="px-1 text-xs text-muted-foreground">
            Connecting a live payment provider, the ML prediction API, and the recovery agent runtime will be part of a
            later integration phase.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
