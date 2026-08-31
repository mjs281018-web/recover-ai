'use client'

import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputPrimitive.Props) {
  return (
    <InputPrimitive
      className={cn(
        'flex h-9 w-full rounded-lg border border-input bg-surface px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
