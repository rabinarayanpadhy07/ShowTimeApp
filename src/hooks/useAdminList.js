import { useCallback, useState } from 'react'

import { useAsync } from './useAsync'

/**
 * A paginated admin list with filters. Changing a filter goes back to the first page.
 * `fetcher` receives the filters plus 0-based `page` and `size`.
 */
export function useAdminList(fetcher, initialFilters = {}, { size = 20 } = {}) {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(0)
  const state = useAsync(() => fetcher({ ...filters, page, size }), [JSON.stringify(filters), page])

  const setFilter = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(0)
  }, [])

  return { ...state, filters, setFilter, page, setPage }
}
