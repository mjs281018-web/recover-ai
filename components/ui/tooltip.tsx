'use client'

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { cn } from '@/lib/utils'

export function TooltipProvider({
  children,
  delay = 200,
}: {
  children: React.ReactNode
  delay?: number
}) {
  return (
    <TooltipPrimitive.Provider delay={delay} closeDelay={0}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

interface TooltipProps {
  children: React.ReactElement
  content?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  /** disable rendering (e.g. when sidebar is expanded) */
  disabled?: boolean
}

export function Tooltip({
  children,
  content,
  side = 'top',
  sideOffset = 8,
  disabled,
}: TooltipProps) {
  if (disabled || content == null || content === '') return children

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset} className="z-50">
          <TooltipPrimitive.Popup
            className={cn(
              'rounded-md border border-border-strong bg-elevated px-2 py-1 text-xs font-medium text-foreground shadow-md',
              'origin-[var(--transform-origin)] transition-[transform,opacity] duration-150',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
