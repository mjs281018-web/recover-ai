import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        neutral: 'border-border-strong bg-surface text-muted-foreground',
        outline: 'border-border-strong bg-transparent text-foreground',
        primary: 'border-primary/25 bg-primary/12 text-primary',
        success: 'border-success/25 bg-success-muted text-success',
        warning: 'border-warning/25 bg-warning-muted text-warning',
        danger: 'border-danger/25 bg-danger-muted text-danger',
        ai: 'border-ai/25 bg-ai-muted text-ai',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
