import { useSearchParams } from 'react-router'

/** Tab state kept in the URL (`?tab=`), so a tab can be linked to and survives reloads. */
export function useTab(tabs) {
  const [params, setParams] = useSearchParams()
  const current = tabs.some((tab) => tab.id === params.get('tab')) ? params.get('tab') : tabs[0].id
  const select = (id) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.set('tab', id)
        return next
      },
      { replace: true },
    )
  return [current, select]
}
