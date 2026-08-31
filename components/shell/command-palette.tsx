'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import {
  Search,
  CornerDownLeft,
  CreditCard,
  Users,
  ScrollText,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'
import { allNavItems } from '@/lib/nav'
import { demoSearchResults } from '@/data/demo'
import type { SearchResultType } from '@/types'
import { useShell } from '@/components/shell/shell-context'

const TYPE_ICON: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  payment: CreditCard,
  transaction: CreditCard,
  customer: Users,
  audit: ScrollText,
  action: ArrowRight,
}

interface Command {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  group: 'Navigation' | 'Results'
  href: string
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useShell()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo<Command[]>(() => {
    const navCommands: Command[] = allNavItems.map((item) => ({
      id: `nav-${item.href}`,
      title: item.label,
      subtitle: item.description,
      icon: item.icon,
      group: 'Navigation',
      href: item.href,
    }))
    const resultCommands: Command[] = demoSearchResults.map((r) => ({
      id: `res-${r.id}`,
      title: r.title,
      subtitle: r.subtitle,
      icon: TYPE_ICON[r.type],
      group: 'Results',
      href:
        r.type === 'customer'
          ? '/customers'
          : r.type === 'audit'
            ? '/audit'
            : '/at-risk',
    }))
    return [...navCommands, ...resultCommands]
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q),
    )
  }, [commands, query])

  const groups = useMemo(() => {
    const nav = filtered.filter((c) => c.group === 'Navigation')
    const res = filtered.filter((c) => c.group === 'Results')
    return [
      { label: 'Results', items: res },
      { label: 'Navigation', items: nav },
    ].filter((g) => g.items.length > 0)
  }, [filtered])

  // flat order matching visual order for keyboard nav
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, commandOpen])

  const runCommand = (href: string) => {
    setCommandOpen(false)
    setQuery('')
    router.push(href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(flat.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flat.length) % Math.max(flat.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = flat[activeIndex]
      if (target) runCommand(target.href)
    }
  }

  return (
    <DialogPrimitive.Root
      open={commandOpen}
      onOpenChange={(open) => {
        setCommandOpen(open)
        if (!open) setQuery('')
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            'fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2',
            'overflow-hidden rounded-2xl border border-border-strong bg-popover text-popover-foreground shadow-popover outline-none',
            'transition-[transform,opacity] duration-200',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
          )}
          onKeyDown={onKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">
            Command palette
          </DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search payments, customers, or jump to a page…"
              className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              aria-label="Search"
            />
            <Kbd>Esc</Kbd>
          </div>

          <div ref={listRef} className="max-h-[22rem] overflow-y-auto scrollbar-thin p-2">
            {flat.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="mb-1.5 last:mb-0">
                  <div className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                    {group.label}
                  </div>
                  {group.items.map((cmd) => {
                    const flatIdx = flat.indexOf(cmd)
                    const active = flatIdx === activeIndex
                    const Icon = cmd.icon
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => runCommand(cmd.href)}
                        onMouseMove={() => setActiveIndex(flatIdx)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors outline-none',
                          active ? 'bg-accent' : 'hover:bg-accent/60',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-md',
                            active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {cmd.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {cmd.subtitle}
                          </span>
                        </span>
                        {active && (
                          <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd>
              to select
            </span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
