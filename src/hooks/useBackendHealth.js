import { useCallback, useEffect, useState } from 'react'

import { getHealth } from '../api/healthApi'

/**
 * Live status of ShowTime-Backend from GET /api/health.
 * status: 'checking' | 'up' | 'degraded' (API up, database down) | 'offline' (API unreachable)
 */
export function useBackendHealth() {
  const [state, setState] = useState({ status: 'checking', health: null, error: null, checkedAt: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getHealth({ signal: controller.signal })
      .then((health) =>
        setState({ status: health?.status === 'UP' ? 'up' : 'degraded', health, error: null, checkedAt: new Date() }),
      )
      .catch((error) => {
        if (error?.code === 'CANCELLED') return
        setState({ status: 'offline', health: null, error, checkedAt: new Date() })
      })
    return () => controller.abort()
  }, [attempt])

  const recheck = useCallback(() => {
    setState((previous) => ({ ...previous, status: 'checking' }))
    setAttempt((count) => count + 1)
  }, [])

  return { ...state, recheck }
}

export const HEALTH_LABELS = {
  checking: 'Checking API…',
  up: 'API online',
  degraded: 'API online · database unavailable',
  offline: 'API offline',
}

export const HEALTH_DOT_CLASSES = {
  checking: 'bg-ink-muted animate-pulse',
  up: 'bg-secondary',
  degraded: 'bg-accent',
  offline: 'bg-danger',
}
