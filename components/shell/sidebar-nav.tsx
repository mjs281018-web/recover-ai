'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navGroups } from '@/lib/nav'
import { Tooltip } from '@/components/ui/tooltip'

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-6 px-3 py-4" aria-label="Primary">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!collapsed && (
            <h2 className="px-2.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
              {group.label}
            </h2>
          )}
          {group.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Tooltip
                key={item.href}
                content={item.label}
                side="right"
                disabled={!collapsed}
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors outline-none',
                    'focus-visible:ring-2 focus-visible:ring-sidebar-ring/60',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                  )}
                >
                  {active && !collapsed && (
                    <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      'size-[18px] shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground',
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </Tooltip>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
