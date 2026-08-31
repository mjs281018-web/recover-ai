'use client'

import { useState } from 'react'
import { Play, RotateCcw, Check, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RecoveryLoopSpinner } from '@/components/brand/recovery-loop-spinner'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PipelineStageKey } from '@/components/overview/agent-state-machine'

const DEMO_AMOUNT = 2_499
const DEMO_PROBABILITY = 0.84
const DEMO_CONFIDENCE = 0.92

interface DemoStep {
  pipelineStage: PipelineStageKey
  title: string
  description: string
  delayMs: number
}

function buildSteps(paymentId: string): DemoStep[] {
  return [
    { pipelineStage: 'observe', title: 'Payment failure detected', description: `${paymentId} failed — ${formatCurrency(DEMO_AMOUNT)} at risk`, delayMs: 400 },
    { pipelineStage: 'analyze', title: 'Root cause analysis', description: 'Classified as a temporary bank decline, not a hard failure', delayMs: 500 },
    { pipelineStage: 'analyze', title: 'Customer context retrieved', description: '4 prior recoveries on file · 92% success rate on UPI', delayMs: 450 },
    { pipelineStage: 'predict', title: 'Recovery probability calculated', description: `${formatPercent(DEMO_PROBABILITY)} probability of recovering this payment`, delayMs: 600 },
    { pipelineStage: 'decide', title: 'Best intervention selected', description: 'Retry over UPI, ranked above smart-retry and escalation', delayMs: 500 },
    { pipelineStage: 'policy-check', title: 'Policy check', description: 'Standard auto-retry policy (PL-01) — passed, no approval required', delayMs: 550 },
    { pipelineStage: 'act', title: 'Recovery action executed', description: 'Retry submitted over UPI', delayMs: 700 },
    { pipelineStage: 'verify', title: 'Payment result verified', description: 'Gateway confirmed the retry succeeded', delayMs: 550 },
    { pipelineStage: 'audit', title: 'Audit event recorded', description: 'Action, decision, and outcome written to the audit trail', delayMs: 400 },
    { pipelineStage: 'audit', title: 'Revenue KPIs updated', description: 'Revenue Recovered, Recovery Rate, and agent activity refreshed', delayMs: 400 },
  ]
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function LiveRecoveryDemo({
  onStageChange,
  onComplete,
  className,
}: {
  onStageChange?: (stage: PipelineStageKey | null) => void
  onComplete?: (amount: number) => void
  className?: string
}) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [activeStepIndex, setActiveStepIndex] = useState(-1)
  const [paymentId, setPaymentId] = useState('P20841')
  const [steps, setSteps] = useState<DemoStep[]>(buildSteps('P20841'))

  async function runDemo() {
    const newId = `P2${Math.floor(1000 + Math.random() * 8999)}`
    const nextSteps = buildSteps(newId)
    setPaymentId(newId)
    setSteps(nextSteps)
    setStatus('running')
    setActiveStepIndex(-1)

    for (let i = 0; i < nextSteps.length; i++) {
      await wait(nextSteps[i].delayMs)
      setActiveStepIndex(i)
      onStageChange?.(nextSteps[i].pipelineStage)
    }
    await wait(300)
    setStatus('done')
    onStageChange?.(null)
    onComplete?.(DEMO_AMOUNT)
  }

  function reset() {
    setStatus('idle')
    setActiveStepIndex(-1)
  }

  return (
    <Card
      className={cn(
        'flex flex-col gap-5 p-5 transition-colors duration-500',
        status === 'running' && 'border-ai/35',
        status === 'done' && 'border-success/35 bg-gradient-to-br from-success-muted/50 via-card to-card',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            Live recovery demo
            <Badge variant="ai">Synthetic</Badge>
          </CardTitle>
          <CardDescription>
            Watch the agent detect, decide, and act on a failed payment end to end — no real payment is touched.
          </CardDescription>
        </div>
        {status === 'idle' && (
          <Button onClick={runDemo} size="lg" className="gap-2">
            <Play className="size-4" />
            Run live recovery
          </Button>
        )}
        {status === 'done' && (
          <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
            <RotateCcw className="size-3.5" />
            Run again
          </Button>
        )}
      </div>

      {status !== 'idle' && (
        <div className="flex flex-col gap-0.5">
          {steps.map((step, i) => {
            const isDone = status === 'done' || i < activeStepIndex
            const isActive = status === 'running' && i === activeStepIndex
            const isPending = !isDone && !isActive
            return (
              <div
                key={step.title}
                className={cn(
                  'flex items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-300',
                  isActive && 'bg-ai-muted/60',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                    isDone && 'border-success/40 bg-success-muted text-success',
                    isActive && 'border-ai bg-ai text-ai-foreground',
                    isPending && 'border-border-strong bg-surface text-transparent',
                  )}
                >
                  {isDone && <Check className="size-3" />}
                  {isActive && <RecoveryLoopSpinner className="size-3 text-ai-foreground [animation-duration:0.9s]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      'text-sm font-medium transition-colors duration-300',
                      isPending ? 'text-muted-foreground/50' : 'text-foreground',
                    )}
                  >
                    {step.title}
                  </div>
                  {!isPending && <div className="text-xs text-muted-foreground">{step.description}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {status === 'done' && (
        <div className="flex flex-col gap-3 rounded-xl border border-success/30 bg-success-muted/40 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" />
            <span className="text-sm font-semibold tracking-wide text-success uppercase">Recovery successful</span>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(DEMO_AMOUNT)} <span className="text-sm font-normal text-muted-foreground">recovered · {paymentId}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
            <div>
              <div className="text-muted-foreground">Recovery probability</div>
              <div className="font-medium text-foreground">{formatPercent(DEMO_PROBABILITY)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Action</div>
              <div className="font-medium text-foreground">Retry (UPI)</div>
            </div>
            <div>
              <div className="text-muted-foreground">Policy</div>
              <div className="font-medium text-success">Passed</div>
            </div>
            <div>
              <div className="text-muted-foreground">AI confidence</div>
              <div className="font-medium text-foreground">{formatPercent(DEMO_CONFIDENCE)}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
