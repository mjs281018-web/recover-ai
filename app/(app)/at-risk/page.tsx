import { AtRiskWorkbench } from '@/components/at-risk/at-risk-workbench'
import { listAtRiskPayments } from '@/services/payment-service'

export default async function AtRiskPage() {
  const payments = await listAtRiskPayments()
  return <AtRiskWorkbench initialPayments={payments} />
}
