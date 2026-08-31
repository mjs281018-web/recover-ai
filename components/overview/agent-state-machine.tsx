import { cn } from '@/lib/utils'
import { AGENT_PIPELINE, type PipelineStageKey } from '@/lib/recovery-pipeline'

export { AGENT_PIPELINE, type PipelineStageKey } from '@/lib/recovery-pipeline'

export function AgentStateMachine({ activeStage }: { activeStage: PipelineStageKey | null }) {
  const activeIndex = activeStage ? AGENT_PIPELINE.findIndex((p) => p.key === activeStage) : -1

  return (
    <div className="scrollbar-thin flex items-center overflow-x-auto pb-1">
      {AGENT_PIPELINE.map((stage, i) => {
        const done = activeIndex > i
        const active = activeIndex === i
        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 px-1">
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-300',
                  active
                    ? 'border-ai bg-ai text-ai-foreground shadow-[0_0_0_4px_var(--color-ai-muted)]'
                    : done
                      ? 'border-ai/40 bg-ai-muted text-ai'
                      : 'border-border-strong bg-surface text-muted-foreground',
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-[10px] font-medium tracking-wide uppercase',
                  active ? 'text-ai' : done ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {stage.label}
              </span>
            </div>
            {i < AGENT_PIPELINE.length - 1 && (
              <div className={cn('h-px w-6 shrink-0 transition-colors duration-300 sm:w-9', done ? 'bg-ai/50' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
