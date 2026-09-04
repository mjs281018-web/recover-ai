import { getOutcomeLearningDashboard } from '@/services/analytics-service'
import { OutcomeLearningDashboard } from '@/components/learning/outcome-learning-dashboard'

export default async function LearningPage() {
  const dashboard = await getOutcomeLearningDashboard()
  return <OutcomeLearningDashboard initial={dashboard} />
}