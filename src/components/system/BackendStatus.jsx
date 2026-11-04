import { HEALTH_DOT_CLASSES, HEALTH_LABELS, useBackendHealth } from '../../hooks/useBackendHealth'
import { cn } from '../../lib/cn'

/** Compact live API status indicator used in the footer. */
export function BackendStatus({ className }) {
  const { status } = useBackendHealth()
  return (
    <p role="status" aria-live="polite" className={cn('inline-flex items-center gap-2 text-xs text-ink-muted', className)}>
      <span aria-hidden="true" className={cn('inline-block size-2 rounded-full', HEALTH_DOT_CLASSES[status])} />
      {HEALTH_LABELS[status]}
    </p>
  )
}
