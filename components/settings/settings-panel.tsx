'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { RecoverAISetting } from '@/services/settings-service'
import { getSettings, updateSetting } from '@/services/settings-service'
import { useRuntimeEvents } from '@/lib/use-runtime-events'

interface SettingsPanelProps {
  initialSettings: RecoverAISetting[]
}

export function SettingsPanel({ initialSettings }: SettingsPanelProps) {
  const [settings, setSettings] = useState<RecoverAISetting[]>(initialSettings)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const event = useRuntimeEvents()

  const refreshSettings = useCallback(async () => {
    const updated = await getSettings()
    setSettings(updated)
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [event, refreshSettings])

  const handleToggle = async (setting: RecoverAISetting) => {
    if (setting.id === 'demo-mode') {
      setError('Demo mode cannot be disabled in this build.')
      return
    }
    setError(null)
    setSuccess(null)
    setLoading(setting.key)
    try {
      const updated = await updateSetting(setting.key, !setting.value)
      if (updated) {
        await refreshSettings()
        setSuccess(`${updated.name} updated successfully.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting.')
    } finally {
      setLoading(null)
    }
  }

  const handleNumberChange = async (setting: RecoverAISetting, newValue: number) => {
    setError(null)
    setSuccess(null)
    setLoading(setting.key)
    try {
      const updated = await updateSetting(setting.key, newValue)
      if (updated) {
        await refreshSettings()
        setSuccess(`${updated.name} updated to ${newValue}${setting.unit ? ' ' + setting.unit : ''}.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting.')
    } finally {
      setLoading(null)
    }
  }

  const categorized = settings.reduce<Record<string, RecoverAISetting[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    policy: 'Policy Configuration',
    recovery: 'Recovery Configuration',
    safety: 'Safety Controls',
    demo: 'Demo Mode',
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    policy: <Settings className="size-4 text-muted-foreground" />,
    recovery: <ShieldCheck className="size-4 text-muted-foreground" />,
    safety: <ShieldAlert className="size-4 text-warning" />,
    demo: <AlertTriangle className="size-4 text-muted-foreground" />,
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        description="Configure RecoverAI behavior. Changes take effect immediately and are reflected across all views."
        actions={<Badge variant="neutral">Demo mode</Badge>}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <XCircle className="size-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4" />
          {success}
        </div>
      )}

      {settings.length === 0 ? (
        <EmptyState icon={Settings} title="No settings available" description="Settings could not be loaded." />
      ) : (
        Object.entries(categorized).map(([category, categorySettings]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                {categoryIcons[category]}
                {categoryLabels[category] ?? category}
              </CardTitle>
              <CardDescription>
                {category === 'policy' && 'Approval thresholds and policy limits.'}
                {category === 'recovery' && 'Recovery behavior and AI confidence thresholds.'}
                {category === 'safety' && 'Safety guardrails that cannot be bypassed.'}
                {category === 'demo' && 'Synthetic demo environment status.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categorySettings.map((setting) => (
                <div key={setting.key} className="flex flex-col gap-2 rounded-lg border border-border-strong bg-surface/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{setting.name}</span>
                      {setting.key === 'fraudProtectionEnabled' && (
                        <Badge variant="warning">Always On</Badge>
                      )}
                      {setting.key === 'demoMode' && (
                        <Badge variant="neutral">Demo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                    <p className="text-xs text-muted-foreground/70">
                      <span className="italic">Affects: {setting.affects}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {setting.type === 'boolean' ? (
                      <Button
                        variant={setting.value === true ? 'default' : 'outline'}
                        size="sm"
                        disabled={loading === setting.key || setting.key === 'demoMode'}
                        onClick={() => handleToggle(setting)}
                      >
                        {setting.value === true ? 'Enabled' : 'Disabled'}
                      </Button>
                    ) : setting.type === 'number' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={setting.value as number}
                          min={setting.min}
                          max={setting.max}
                          step={setting.step}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            if (!Number.isNaN(val)) {
                              handleNumberChange(setting, val)
                            }
                          }}
                          className="w-28 rounded-md border border-border-strong bg-background px-2 py-1 text-sm tabular-nums"
                        />
                        {setting.unit && (
                          <span className="text-xs text-muted-foreground">{setting.unit}</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}