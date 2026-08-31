import { cn } from '@/lib/utils'

/** The brand's recovery-loop mark, animated to indicate the agent is working. */
export function RecoveryLoopSpinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('size-5 animate-spin text-ai [animation-duration:1.4s]', className)}
    >
      <path
        d="M25.5 16a9.5 9.5 0 1 1-3.6-7.45"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity={0.9}
      />
      <circle cx="16" cy="16" r="2.6" fill="currentColor" />
    </svg>
  )
}
