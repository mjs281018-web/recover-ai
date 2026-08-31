'use client'

import { Activity } from 'lucide-react'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { Logo } from '@/components/brand/logo'
import { SidebarNav } from '@/components/shell/sidebar-nav'
import { useShell } from '@/components/shell/shell-context'

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useShell()

  return (
    <Drawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <DrawerContent side="left" showClose={false} className="w-[min(18rem,85vw)]">
        <DrawerTitle className="sr-only">Navigation</DrawerTitle>
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
          <Logo />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </div>
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2 rounded-lg bg-success-muted px-2.5 py-1.5">
            <Activity className="size-4 text-success" />
            <span className="text-xs font-medium text-success">
              Recovery engine live
            </span>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
