'use client'

import Link from 'next/link'
import {
  ChevronsUpDown,
  Settings,
  ShieldCheck,
  LifeBuoy,
  LogOut,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { demoMerchant } from '@/data/demo'

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1 pr-2 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 outline-none"
            aria-label="Account menu"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/25">
              {demoMerchant.initials}
            </span>
            <span className="hidden min-w-0 flex-col md:flex">
              <span className="truncate text-sm font-medium text-foreground">
                {demoMerchant.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {demoMerchant.workspace}
              </span>
            </span>
            <ChevronsUpDown className="hidden size-4 text-muted-foreground md:block" />
          </button>
        }
      />
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          <span className="block text-sm font-medium text-foreground">{demoMerchant.name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {demoMerchant.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings />
          Workspace settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/policy" />}>
          <ShieldCheck />
          Policy &amp; safety
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.show({ title: 'Support', description: 'Help center is not part of this demo.', tone: 'info' })}
        >
          <LifeBuoy />
          Help &amp; support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="danger"
          onClick={() => toast.warning('Signed out', 'This is a demo — no real session ended.')}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
