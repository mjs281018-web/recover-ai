'use client'

import { Search } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'
import { useShell } from '@/components/shell/shell-context'

export function SearchTrigger() {
  const { setCommandOpen } = useShell()

  return (
    <button
      type="button"
      onClick={() => setCommandOpen(true)}
      className="group flex h-9 w-full max-w-sm items-center gap-2.5 rounded-lg border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:bg-elevated focus-visible:ring-2 focus-visible:ring-ring/60 outline-none"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 text-left">Search payments, customers…</span>
      <span className="hidden items-center gap-1 sm:flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  )
}
