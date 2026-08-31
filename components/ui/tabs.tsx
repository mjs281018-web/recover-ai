'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root
export const TabsPanel = TabsPrimitive.Panel

export function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      className={cn(
        'relative inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        'relative z-10 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none select-none',
        'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60',
        'data-[selected]:bg-elevated data-[selected]:text-foreground data-[selected]:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
