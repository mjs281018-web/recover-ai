'use client'

import { useState } from 'react'
import { Eye, Brain, TrendingUp, Zap, ShieldCheck, Send, CircleCheck as CheckCircle2, ScrollText, ChevronDown, Check, CircleDot, ShieldAlert, ShieldOff, Lock, Cpu, Activity, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import { RECOVERY_ACTION_LABELS } from '@/types'
import type { AgentEvent, AgentDecision, Prediction } from '@/types'

const KIND_ICON: Record<AgentEvent['kind'], React.ComponentType<{ className?: string }>> = {
  analysis: Eye,
  decision: Brain,
  action: Zap,
  escalation: ShieldAlert,
  learning: ScrollText,
}

const KIND_COLOR: Record<AgentEvent['kind'], string> = {
  analysis: 'text-ai',
  decision: 'text-primary',
  action: 'text-success',
  escalation: 'text-warning',
  learning: 'text-ai',
}

const KIND_LABEL: Record<AgentEvent['kind'], string> = {
  analysis: 'ANALYSIS',
  decision: 'DECISION',
  action: 'ACTION',
  escalation: 'ESCALATION',
  learning: 'LEARNING',
}

const PIPELINE = [
  { key: 'observe', label: 'Observe', icon: Eye, desc: 'Payment failure detected' },
  { key: 'analyze', label: 'Analyze', icon: Brain, desc: 'Root cause identified' },
  { key: 'predict', label: 'Predict', icon: TrendingUp, desc: 'Recovery probability calculated' },
  { key: 'decide', label: 'Decide', icon: Zap, desc: 'Best intervention selected' },
  { key: 'policy-check', label: 'Policy check', icon: ShieldCheck, desc: 'Action evaluated against policy' },
  { key: 'act', label: 'Act', icon: Send, desc: 'Recovery action executed' },
  { key: 'verify', label: 'Verify', icon: CheckCircle2, desc: 'Payment outcome confirmed' },
  { key: 'audit', label: 'Audit', icon: ScrollText, desc: 'Decision recorded' },
] as const

const DECISION_FLOW = [
  { label: 'Payment Failure', icon: ShieldAlert, desc: 'A payment fails at the gateway and enters the recovery pipeline.' },
  { label: 'Root Cause', icon: Eye, desc: 'The agent classifies the failure reason from gateway response codes.' },
  { label: 'Recovery Probability', icon: TrendingUp, desc: 'The model estimates the likelihood of a successful recovery.' },
  { label: 'Available Strategies', icon: Cpu, desc: 'Matching recovery strategies are ranked by historical success rate.' },
  { label: 'Policy Evaluation', icon: ShieldCheck, desc: 'The selected action is checked against active policy guardrails.' },
  { label: 'Final Decision', icon: Zap, desc: 'The agent executes, escalates, or holds based on the evaluation.' },
] as const

function formatTimestampLabel(value: string): string {
  const match = value.match(/T(\d{2}:\d{2}:\d{2})/)
  return match ? match[1] : value
}

/** Animated concentric orbit — a subtle AI processing visual. */
function OrbitVisual() {
  return (
    <div className="relative flex size-20 shrink-0 items-center justify-center">
      <div className="absolute size-20 rounded-full border border-ai/20" />
      <div className="absolute size-14 rounded-full border border-ai/30" />
      <div className="absolute size-8 rounded-full border border-ai/40" />
      <div className="absolute size-20 animate-spin [animation-duration:8s]">
        <div className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ai" />
      </div>
      <div className="absolute size-14 animate-spin [animation-duration:6s] [animation-direction:reverse]">
        <div className="absolute top-0 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
      </div>
      <div className="relative flex size-6 items-center justify-center rounded-full bg-ai-muted">
        <Sparkles className="size-3 text-ai" />
      </div>
    </div>
  )
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'ai' | 'neutral' }) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'ai'
          ? 'text-ai'
          : 'text-muted-foreground'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">{label}</span>
      <span className={cn('text-xs font-semibold tracking-wide uppercase', toneClass)}>{value}</span>
    </div>
  )
}

export interface AgentCommandCenterProps {
  events: AgentEvent[]
  decisions: AgentDecision[]
  predictions: Prediction[]
  metrics: {
    aiActionsExecuted: number
    humanEscalations: number
    safetyBlocks: number
    averageRecoveryTimeMinutes: number
    revenueRecovered: number
    recoveryRate: number
  }
}

export function AgentCommandCenter({ events, decisions, predictions, metrics }: AgentCommandCenterProps) {
  const [activeStage, setActiveStage] = useState<number>(5)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(events[0]?.id ?? null)
  const [hoveredFlow, setHoveredFlow] = useState<number | null>(null)

  const featuredDecision = decisions[0]
  const featuredPrediction = predictions.find((p) => p.paymentId === featuredDecision?.paymentId) ?? predictions[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Agent Status Hero Card */}
      <Card className="relative overflow-hidden border-ai/20">
        <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-ai-muted/30 blur-3xl" />
        <CardContent className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <OrbitVisual />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">RecoverAI Agent</h2>
                <Badge variant="success" className="gap-1">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                  </span>
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Revenue Recovery Intelligence</p>
              <p className="text-xs text-muted-foreground/70">Monitoring payment failures across all channels</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatusPill label="Current Mode" value="Autonomous" tone="ai" />
            <StatusPill label="Confidence" value="94%" tone="success" />
            <StatusPill label="Risk Guard" value="Active" tone="success" />
            <StatusPill label="Policy Engine" value="Online" tone="success" />
            <StatusPill label="Provider" value="Synthetic" tone="neutral" />
          </div>
        </CardContent>
      </Card>

      {/* Live Agent State Machine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Activity className="size-4 text-ai" />
            Recovery Lifecycle
          </CardTitle>
          <CardDescription>The eight-stage pipeline the agent runs for every at-risk payment.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="scrollbar-thin flex items-stretch gap-1 overflow-x-auto pb-2">
            {PIPELINE.map((stage, i) => {
              const done = i < activeStage
              const active = i === activeStage
              const Icon = stage.icon
              return (
                <div key={stage.key} className="flex items-stretch gap-1">
                  <Tooltip content={stage.desc} side="bottom">
                    <button
                      type="button"
                      onClick={() => setActiveStage(i)}
                      className={cn(
                        'group flex w-24 shrink-0 flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all duration-300',
                        active
                          ? 'border-ai bg-ai-muted/60 shadow-[0_0_0_3px_var(--color-ai-muted)]'
                          : done
                            ? 'border-ai/30 bg-ai-muted/20 hover:border-ai/40'
                            : 'border-border bg-surface hover:border-border-strong hover:bg-elevated',
                      )}
                    >
                      <div
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                          active
                            ? 'border-ai bg-ai text-ai-foreground'
                            : done
                              ? 'border-ai/40 bg-ai-muted text-ai'
                              : 'border-border-strong bg-surface text-muted-foreground',
                        )}
                      >
                        {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                      </div>
                      {active && (
                        <span className="absolute mt-12 flex size-1.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-ai opacity-60" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-ai" />
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[10px] font-semibold tracking-wide uppercase',
                          active ? 'text-ai' : done ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {stage.label}
                      </span>
                    </button>
                  </Tooltip>
                  {i < PIPELINE.length - 1 && (
                    <div className="flex items-center">
                      <div className={cn('h-px w-3 shrink-0 transition-colors duration-300', done ? 'bg-ai/50' : 'bg-border')} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Activity + AI Decision Panel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Live Agent Activity */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <CircleDot className="size-4 text-ai" />
              Live Agent Activity
            </CardTitle>
            <CardDescription>Real-time event stream from the recovery agent.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-0">
              {events.slice(0, 8).map((event, i) => {
                const Icon = KIND_ICON[event.kind]
                const isOpen = expandedEvent === event.id
                const isLast = i === Math.min(events.length, 8) - 1
                return (
                  <div key={event.id} className="relative">
                    {!isLast && <div className="absolute top-9 left-3.5 h-full w-px bg-border" />}
                    <button
                      type="button"
                      onClick={() => setExpandedEvent(isOpen ? null : event.id)}
                      className="flex w-full items-start gap-3 py-2.5 text-left transition-colors hover:bg-accent/30 rounded-lg px-1"
                    >
                      <span
                        className={cn(
                          'relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card',
                          KIND_COLOR[event.kind],
                          event.kind === 'action' ? 'border-success/30' : event.kind === 'escalation' ? 'border-warning/30' : 'border-ai/30',
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                            {KIND_LABEL[event.kind]}
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                            {formatTimestampLabel(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-snug text-foreground">{event.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{event.description}</p>
                      </div>
                      <ChevronDown
                        className={cn(
                          'mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="ml-[42px] flex flex-wrap items-center gap-x-3 gap-y-1 pb-2 text-[11px] text-muted-foreground">
                        {event.paymentId && (
                          <span>
                            Payment <span className="font-mono text-foreground">{event.paymentId}</span>
                          </span>
                        )}
                        {event.confidence !== undefined && (
                          <span>
                            Confidence <span className="font-medium text-foreground">{formatPercent(event.confidence)}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Decision Panel */}
        {featuredDecision && (
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Brain className="size-4 text-ai" />
                AI Decision Panel
              </CardTitle>
              <CardDescription>The agent&apos;s reasoning behind its most recent recovery decision.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 pt-0">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface/40 p-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs text-muted-foreground">{featuredDecision.paymentId}</span>
                  <p className="text-base font-semibold text-foreground">{featuredDecision.summary}</p>
                </div>
                <Badge variant="ai" className="shrink-0">
                  {RECOVERY_ACTION_LABELS[featuredDecision.recommendedAction]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-surface/40 p-3">
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">Confidence</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums text-ai">
                    {formatPercent(featuredDecision.confidence)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface/40 p-3">
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">Risk</div>
                  <div className="mt-1 text-lg font-semibold text-success">Low</div>
                </div>
                <div className="rounded-lg border border-border bg-surface/40 p-3">
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">Policy</div>
                  <div className="mt-1 flex items-center gap-1 text-lg font-semibold text-success">
                    <ShieldCheck className="size-4" />
                    Passed
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface/40 p-3">
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">Approval</div>
                  <div className="mt-1 text-lg font-semibold text-muted-foreground">
                    {featuredDecision.requiresApproval ? 'Required' : 'Not required'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">Reasoning</span>
                <ul className="space-y-2">
                  {featuredDecision.reasoning.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ai" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {featuredDecision.alternativeActions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground/70">Alternatives considered:</span>
                  {featuredDecision.alternativeActions.map((action) => (
                    <Badge key={action} variant="neutral">
                      {RECOVERY_ACTION_LABELS[action]}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recovery Probability + Bounded Autonomy */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recovery Probability Visual */}
        {featuredPrediction && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <TrendingUp className="size-4 text-ai" />
                Recovery Probability
              </CardTitle>
              <CardDescription>Model-estimated likelihood of recovering this payment.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 pt-0">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-semibold tabular-nums text-foreground">
                    {formatPercent(featuredPrediction.recoveryProbability)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {featuredPrediction.recoveryProbability >= 0.75
                      ? 'High likelihood of recovery'
                      : featuredPrediction.recoveryProbability >= 0.5
                        ? 'Moderate likelihood of recovery'
                        : 'Low likelihood of recovery'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">Model</div>
                  <div className="font-mono text-xs text-muted-foreground">{featuredPrediction.modelVersion}</div>
                </div>
              </div>
              <ProbabilityBar value={featuredPrediction.recoveryProbability} showLabel={false} className="h-2.5" />
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                <div>
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">Expected Recovery</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums text-success">
                    {formatCompactCurrency(2499)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">Risk Level</div>
                  <div className="mt-0.5 text-sm font-semibold text-success">Low</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">Est. Confidence</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums text-ai">
                    {formatPercent(featuredPrediction.confidence)}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-border pt-4">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">Key Factors</span>
                {featuredPrediction.factors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CircleDot className="mt-0.5 size-3 shrink-0 text-ai/60" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bounded Autonomy / Safety Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Lock className="size-4 text-ai" />
              Bounded Autonomy
            </CardTitle>
            <CardDescription>AI acts within predefined financial and policy limits.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="rounded-lg border border-success/25 bg-success-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" />
                <span className="text-xs font-semibold tracking-wide text-success uppercase">Autonomous Actions</span>
              </div>
              <ul className="space-y-1.5">
                {['Low-risk retries', 'Customer notifications', 'Approved recovery strategies'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="size-3.5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-warning/25 bg-warning-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldAlert className="size-4 text-warning" />
                <span className="text-xs font-semibold tracking-wide text-warning uppercase">Human Approval</span>
              </div>
              <ul className="space-y-1.5">
                {['High-value transactions', 'Policy exceptions', 'High-risk actions'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldAlert className="size-3.5 shrink-0 text-warning" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-danger/25 bg-danger-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldOff className="size-4 text-danger" />
                <span className="text-xs font-semibold tracking-wide text-danger uppercase">Blocked Actions</span>
              </div>
              <ul className="space-y-1.5">
                {['Out-of-policy actions', 'Unsafe interventions'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldOff className="size-3.5 shrink-0 text-danger" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision / Reasoning Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Cpu className="size-4 text-ai" />
            Decision Flow
          </CardTitle>
          <CardDescription>How a payment failure becomes a bounded, audited recovery decision.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-0">
            {DECISION_FLOW.map((step, i) => {
              const Icon = step.icon
              const isHovered = hoveredFlow === i
              const isLast = i === DECISION_FLOW.length - 1
              return (
                <div key={step.label} className="relative">
                  {!isLast && <div className="absolute top-12 left-5 h-full w-px bg-border" />}
                  <Tooltip content={step.desc} side="right">
                    <div
                      onMouseEnter={() => setHoveredFlow(i)}
                      onMouseLeave={() => setHoveredFlow(null)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg p-3 transition-all duration-200',
                        isHovered ? 'bg-ai-muted/30 -mr-2' : '',
                      )}
                    >
                      <span
                        className={cn(
                          'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
                          isHovered
                            ? 'border-ai bg-ai text-ai-foreground shadow-[0_0_0_3px_var(--color-ai-muted)]'
                            : 'border-border-strong bg-surface text-muted-foreground',
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={cn('text-sm font-semibold transition-colors', isHovered ? 'text-ai' : 'text-foreground')}>
                          {step.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{step.desc}</div>
                      </div>
                    </div>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-ai-muted text-ai">
              <Eye className="size-3.5" />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">Payments Analyzed</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-foreground">10,000</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Brain className="size-3.5" />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">Recovery Decisions</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
            {metrics.aiActionsExecuted.toLocaleString('en-IN')}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-success-muted text-success">
              <CheckCircle2 className="size-3.5" />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">Successful Recoveries</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-foreground">3,842</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-success-muted text-success">
              <TrendingUp className="size-3.5" />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">Revenue Recovered</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-success">
            {formatCompactCurrency(metrics.revenueRecovered)}
          </div>
        </Card>
      </div>
    </div>
  )
}
