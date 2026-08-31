'use client'

import { PanelLeftClose, PanelLeft, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo, LogoMark } from '@/components/brand/logo'
import { SidebarNav } from '@/components/shell/sidebar-nav'
import { IconButton } from '@/components/ui/icon-button'
import { useShell } from '@/components/shell/shell-context'

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useShell()

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border px-4',
          collapsed ? 'justify-center px-0' : 'justify-between',
        )}
      >
        {collapsed ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-inset ring-primary/25">
            <LogoMark className="size-5" />
          </span>
        ) : (
          <Logo />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg text-success">
              <Activity className="size-[18px]" />
            </span>
            <IconButton
              label="Expand sidebar"
              tooltipSide="right"
              onClick={toggleCollapsed}
            >
              <PanelLeft />
            </IconButton>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-success-muted px-2.5 py-1.5">
              <Activity className="size-4 text-success" />
              <span className="text-xs font-medium text-success">
                Recovery engine live
              </span>
            </div>
            <IconButton
              label="Collapse sidebar"
              tooltipSide="right"
              onClick={toggleCollapsed}
            >
              <PanelLeftClose />
            </IconButton>
          </div>
        )}
      </div>
    </aside>
  )
}
