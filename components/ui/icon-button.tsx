'use client'

import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        ghost: 'hover:bg-accent hover:text-foreground',
        outline: 'border-border-strong bg-surface hover:bg-accent hover:text-foreground',
      },
      size: {
        sm: 'size-8',
        md: 'size-9',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
)

interface IconButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof iconButtonVariants> {
  label: string
  tooltip?: boolean
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left'
}

export function IconButton({
  className,
  variant,
  size,
  label,
  tooltip = true,
  tooltipSide = 'bottom',
  children,
  ...props
}: IconButtonProps) {
  const button = (
    <ButtonPrimitive
      aria-label={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )

  if (!tooltip) return button
  return (
    <Tooltip content={label} side={tooltipSide}>
      {button}
    </Tooltip>
  )
}
