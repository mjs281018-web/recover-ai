import { PageContainer } from '@/components/foundation/page-container'
import { SectionHeader } from '@/components/ui/section-header'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { getSettings } from '@/services/settings-service'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <PageContainer>
      <SectionHeader
        title="Settings"
        description="Configure RecoverAI behavior. Changes take effect immediately and are reflected across all views."
      />
      <SettingsPanel initialSettings={settings} />
    </PageContainer>
  )
}