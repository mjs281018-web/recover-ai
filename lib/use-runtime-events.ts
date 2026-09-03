'use client'

import { useEffect, useReducer } from 'react'
import { subscribe, type RuntimeEvent } from '@/lib/runtime-events'

/**
 * Re-renders the calling component whenever a runtime event fires.
 * Returns the latest event so components can optionally inspect it.
 *
 * Usage:
 *   const event = useRuntimeEvents()
 *   // then re-fetch data from service layer in an effect keyed on `event`
 */
export function useRuntimeEvents(): RuntimeEvent | null {
  const [event, bump] = useReducer(
    (_prev: RuntimeEvent | null, next: RuntimeEvent) => next,
    null,
  )

  useEffect(() => {
    return subscribe((e) => bump(e))
  }, [])

  return event
}
