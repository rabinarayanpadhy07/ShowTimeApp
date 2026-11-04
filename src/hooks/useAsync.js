import { useCallback, useEffect, useState } from 'react'

/**
 * Runs an async function whenever `deps` change and tracks loading/error/data.
 * Stale responses (from an older dependency set) are ignored.
 */
export function useAsync(asyncFn, deps) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    asyncFn().then(
      (data) => active && setState({ status: 'success', data, error: null }),
      (error) => active && setState({ status: 'error', data: null, error }),
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  return {
    data: state.data,
    error: state.error,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    reload,
  }
}
