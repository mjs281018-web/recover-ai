'use client'

import { ShellProvider } from '@/components/shell/shell-context'
import { Sidebar } from '@/components/shell/sidebar'
import { Topbar } from '@/components/shell/topbar'
import { MobileNav } from '@/components/shell/mobile-nav'
import { CommandPalette } from '@/components/shell/command-palette'
import { Toaster } from '@/components/ui/toast'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Toaster>
      <ShellProvider>
        <div className="flex min-h-svh w-full bg-background">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
        <MobileNav />
        <CommandPalette />
      </ShellProvider>
    </Toaster>
  )
}
