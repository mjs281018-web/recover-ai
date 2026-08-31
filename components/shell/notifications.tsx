'use client'

import { useState } from 'react'
import { Bell, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/icon-button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { demoNotifications } from '@/data/demo'
import type { NotificationKind } from '@/types'

const KIND_ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  ai: Sparkles,
}

const KIND_COLOR: Record<NotificationKind, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  ai: 'text-ai',
}

export function Notifications() {
  const [items, setItems] = useState(demoNotifications)
  const unread = items.filter((n) => n.unread).length

  return (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton label="Notifications" tooltip={false}>
            <span className="relative">
              <Bell />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {unread}
                </span>
              )}
            </span>
          </IconButton>
        }
      />
      <PopoverContent className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => setItems((prev) => prev.map((n) => ({ ...n, unread: false })))}
              className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Mark all read
            </button>
          )}
        </div>
        <ul className="max-h-[22rem] overflow-y-auto scrollbar-thin p-1.5">
          {items.map((n) => {
            const Icon = KIND_ICON[n.kind]
            return (
              <li key={n.id}>
                <div
                  className={cn(
                    'flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent',
                    n.unread && 'bg-accent/40',
                  )}
                >
                  <Icon className={cn('mt-0.5 size-4 shrink-0', KIND_COLOR[n.kind])} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.detail}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{n.timestamp}</p>
                  </div>
                  {n.unread && (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
