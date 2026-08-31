'use client'

import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Info,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const toastManager = ToastPrimitive.createToastManager()

type ToastTone = 'success' | 'warning' | 'danger' | 'ai' | 'info'

const TONE_ICON: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  ai: Sparkles,
  info: Info,
}

const TONE_COLOR: Record<ToastTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  ai: 'text-ai',
  info: 'text-muted-foreground',
}

interface ToastData {
  tone?: ToastTone
}

/** Fire a toast from anywhere (client-side). */
export const toast = {
  show: (opts: {
    title: string
    description?: string
    tone?: ToastTone
    timeout?: number
  }) =>
    toastManager.add({
      title: opts.title,
      description: opts.description,
      timeout: opts.timeout ?? 5000,
      data: { tone: opts.tone ?? 'info' } satisfies ToastData,
    }),
  success: (title: string, description?: string) =>
    toast.show({ title, description, tone: 'success' }),
  warning: (title: string, description?: string) =>
    toast.show({ title, description, tone: 'warning' }),
  danger: (title: string, description?: string) =>
    toast.show({ title, description, tone: 'danger' }),
  ai: (title: string, description?: string) =>
    toast.show({ title, description, tone: 'ai' }),
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()
  return toasts.map((item) => {
    const tone = (item.data as ToastData | undefined)?.tone ?? 'info'
    const Icon = TONE_ICON[tone]
    return (
      <ToastPrimitive.Root
        key={item.id}
        toast={item}
        className={cn(
          'absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] w-[22rem] max-w-[calc(100vw-2rem)]',
          'rounded-xl border border-border-strong bg-elevated p-4 shadow-popover',
          'transition-all duration-300 select-none',
          '[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-index)*-0.75rem))_scale(calc(1-(var(--toast-index)*0.05)))]',
          'data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-offset-y)*-1-(var(--toast-index)*0.75rem)))]',
          'data-[starting-style]:[transform:translateY(150%)] data-[ending-style]:opacity-0',
          'data-[ending-style]:[transform:translateY(150%)]',
        )}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn('mt-0.5 size-5 shrink-0', TONE_COLOR[tone])} />
          <div className="flex-1 space-y-0.5">
            <ToastPrimitive.Title className="text-sm font-semibold text-foreground" />
            <ToastPrimitive.Description className="text-sm leading-relaxed text-muted-foreground" />
          </div>
          <ToastPrimitive.Close
            aria-label="Dismiss"
            className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none"
          >
            <X className="size-4" />
          </ToastPrimitive.Close>
        </div>
      </ToastPrimitive.Root>
    )
  })
}

export function Toaster({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager}>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-[100] mx-auto flex w-[22rem] max-w-[calc(100vw-2rem)] sm:right-6 sm:bottom-6">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}
