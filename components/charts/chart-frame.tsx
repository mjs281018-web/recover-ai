import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Legend swatch + label, reused by every chart that shows more than one series. */
export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; dashed?: boolean }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className={cn('inline-block h-0.5 w-3.5 rounded-full', item.dashed && 'opacity-70')}
            style={{
              backgroundColor: item.dashed ? 'transparent' : item.color,
              borderTop: item.dashed ? `2px dashed ${item.color}` : undefined,
            }}
          />
          <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Common card shell every command-center chart renders inside. */
export function ChartFrame({
  title,
  description,
  actions,
  legend,
  className,
  isEmpty,
  empty,
  children,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  legend?: React.ReactNode
  className?: string
  isEmpty?: boolean
  empty?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {legend}
        {isEmpty && empty ? empty : children}
      </CardContent>
    </Card>
  )
}
