import { Inbox, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Button } from './Button'

export function Spinner({ size = 24, label = 'Loading', className }) {
  return (
    <span role="status" className={cn('inline-flex items-center', className)}>
      <LoaderCircle aria-hidden="true" size={size} className="animate-spin text-primary" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-ink-muted', className)}>
      <Spinner size={32} label={label} />
      <p className="text-sm" aria-hidden="true">
        {label}
      </p>
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  action,
  className,
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert aria-hidden="true" size={26} />
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-ink-secondary">{message}</p>
      {(onRetry || action) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <Button variant="outline" leftIcon={RefreshCw} onClick={onRetry}>
              Try again
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-surface-subtle text-ink-secondary">
        <Icon aria-hidden="true" size={26} />
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {message && <p className="mt-1.5 max-w-md text-sm text-ink-secondary">{message}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
