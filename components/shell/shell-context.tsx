'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ShellContextValue {
  collapsed: boolean
  toggleCollapsed: () => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [])

  return (
    <ShellContext.Provider
      value={{
        collapsed,
        toggleCollapsed,
        mobileNavOpen,
        setMobileNavOpen,
        commandOpen,
        setCommandOpen,
      }}
    >
      {children}
    </ShellContext.Provider>
  )
}

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used within ShellProvider')
  return ctx
}
