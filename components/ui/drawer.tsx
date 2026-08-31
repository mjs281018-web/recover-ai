'use client'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Drawer = DialogPrimitive.Root
export const DrawerTrigger = DialogPrimitive.Trigger
export const DrawerClose = DialogPrimitive.Close

const sideStyles: Record<string, string> = {
  left: 'inset-y-0 left-0 h-full w-[min(20rem,85vw)] border-r data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
  right:
    'inset-y-0 right-0 h-full w-[min(26rem,90vw)] border-l data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
}

export function DrawerContent({
  className,
  children,
  side = 'right',
  showClose = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: 'left' | 'right'
  showClose?: boolean
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
        )}
      />
      <DialogPrimitive.Popup
        className={cn(
          'fixed z-50 flex flex-col border-border-strong bg-sidebar text-sidebar-foreground shadow-lg outline-none',
          'transition-transform duration-300 ease-out',
          sideStyles[side],
          className,
        )}
        {...props}
      >
        {showClose && (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

export const DrawerTitle = DialogPrimitive.Title
export const DrawerDescription = DialogPrimitive.Description
