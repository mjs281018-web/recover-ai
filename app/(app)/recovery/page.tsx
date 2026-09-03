import { RecoveryFlow } from '@/components/recovery/recovery-flow'
import { listPayments } from '@/services/payment-service'
import { listRecoveryActions } from '@/services/recovery-service'

export default async function RecoveryPage() {
  const [active, actions] = await Promise.all([
    listPayments({ status: ['in-progress', 'recovered'] }),
    listRecoveryActions(),
  ])

  return <RecoveryFlow initialPayments={active} initialActions={actions} />
}
