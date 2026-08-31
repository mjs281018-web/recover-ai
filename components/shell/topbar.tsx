'use client'

import { Menu, LifeBuoy } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { SearchTrigger } from '@/components/shell/search-trigger'
import { Notifications } from '@/components/shell/notifications'
import { UserMenu } from '@/components/shell/user-menu'
import { useShell } from '@/components/shell/shell-context'
import { toast } from '@/components/ui/toast'
import { DEMO_BANNER } from '@/data/demo'

export function Topbar() {
  const { setMobileNavOpen } = useShell()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <IconButton
        label="Open navigation"
        tooltip={false}
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu />
      </IconButton>

      <div className="flex flex-1 items-center gap-3">
        <SearchTrigger />
      </div>

      <div className="flex items-center gap-1.5">
        <Tooltip content={DEMO_BANNER}>
          <Badge variant="warning" className="hidden sm:inline-flex">
            Demo data
          </Badge>
        </Tooltip>
        <IconButton
          label="Help"
          className="hidden sm:inline-flex"
          onClick={() =>
            toast.show({
              title: 'Help center',
              description: 'Documentation is not part of this demo.',
              tone: 'info',
            })
          }
        >
          <LifeBuoy />
        </IconButton>
        <Notifications />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <UserMenu />
      </div>
    </header>
  )
}
