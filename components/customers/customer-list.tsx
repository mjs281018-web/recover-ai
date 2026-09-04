'use client'

import Link from 'next/link'
import { PreviewTable, PreviewRow, PreviewCell } from '@/components/foundation/preview-table'
import { RiskBadge } from '@/components/ui/status-badge'
import type { Customer } from '@/types'
import { formatCompactCurrency } from '@/lib/format'

interface CustomerListProps {
  customers: Customer[]
}

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <PreviewTable columns={['Customer', 'Segment', 'Lifetime value', 'Active mandates', 'Recovered', 'Failed', 'Risk profile']}>
      {customers.map((customer) => (
        <PreviewRow key={customer.id} onClick={() => {}}>
          <PreviewCell>
            <Link href={`/customers/${customer.id}`} className="flex flex-col">
              <span className="font-medium text-foreground">{customer.name}</span>
              <span className="text-xs text-muted-foreground">{customer.email}</span>
            </Link>
          </PreviewCell>
          <PreviewCell className="capitalize text-muted-foreground">{customer.segment}</PreviewCell>
          <PreviewCell className="tabular-nums">{formatCompactCurrency(customer.lifetimeValue)}</PreviewCell>
          <PreviewCell className="tabular-nums">{customer.activeMandates}</PreviewCell>
          <PreviewCell className="tabular-nums text-success">{customer.recoveredCount}</PreviewCell>
          <PreviewCell className="tabular-nums text-danger">{customer.failedCount}</PreviewCell>
          <PreviewCell>
            <RiskBadge risk={customer.riskProfile} />
          </PreviewCell>
        </PreviewRow>
      ))}
    </PreviewTable>
  )
}