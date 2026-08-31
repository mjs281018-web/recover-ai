import { cn } from '@/lib/utils'

/** Consistent outer spacing/width for every foundation page. */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6', className)}>
      {children}
    </div>
  )
}
