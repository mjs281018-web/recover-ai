import { PageContainer } from '@/components/foundation/page-container'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { getAnalyticsDashboard } from '@/services/analytics-service'

export default async function AnalyticsPage() {
  const dashboard = await getAnalyticsDashboard()

  return (
    <PageContainer>
      <AnalyticsDashboard initial={dashboard} />
    </PageContainer>
  )
}