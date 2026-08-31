import { cn } from '@/lib/utils'

/** Lightweight table shell reused across foundation pages for tabular previews. */
export function PreviewTable({
  columns,
  children,
  className,
}: {
  columns: string[]
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2.5 font-medium first:pl-5 last:pr-5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}

export function PreviewRow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <tr className={cn('transition-colors hover:bg-accent/40', className)}>{children}</tr>
}

export function PreviewCell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-4 py-3 align-middle text-foreground first:pl-5 last:pr-5', className)}>
      {children}
    </td>
  )
}
