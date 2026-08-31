import { cn } from '@/lib/utils'

/**
 * RecoverAI logo mark — a geometric "recovery loop":
 * an open circular path that curves back on itself (revenue returning),
 * anchored by a signal node (the payment) with a subtle intelligence pulse.
 * Deliberately abstract: no robots, brains, or circuitry.
 */
export function LogoMark({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('size-8', className)}
      {...props}
    >
      {/* recovery loop — an arc that returns, gapped like a refresh/recovery cycle */}
      <path
        d="M25.5 16a9.5 9.5 0 1 1-3.6-7.45"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* returning arrowhead — revenue flowing back in */}
      <path
        d="M22.4 3.2v5.2h-5.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* payment signal node with intelligence accent */}
      <circle cx="16" cy="16" r="3.1" fill="currentColor" />
    </svg>
  )
}

export function Logo({
  className,
  showWordmark = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showWordmark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)} {...props}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-inset ring-primary/25">
        <LogoMark className="size-5" />
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Recover<span className="text-primary">AI</span>
        </span>
      )}
    </div>
  )
}
