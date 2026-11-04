import { useId, useState } from 'react'

import { serverFieldErrors } from '../../lib/serverErrors'
import { cn } from '../../lib/cn'
import { STATUS_TONE } from '../../lib/adminLabels'
import { Alert } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Pagination } from '../ui/Pagination'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState, ErrorState } from '../ui/States'

/** Title row of an admin page with optional actions on the right. */
export function AdminPage({ title, description, actions, children }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function FilterBar({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

export function StatusBadge({ value, labels }) {
  return <Badge tone={STATUS_TONE[value] ?? 'neutral'}>{labels?.[value] ?? value}</Badge>
}

/**
 * Paginated table for an admin list (see useAdminList). `columns` are
 * { header, cell(row), className? }; the first column is the row header.
 * Below the md breakpoint each row is shown as a stacked card (label: value per line)
 * instead of a wide table that needs sideways scrolling.
 */
export function DataTable({ label, columns, list, rowKey = (row) => row.id, emptyTitle = 'Nothing to show' }) {
  const { data, isLoading, error, reload, page, setPage } = list
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {isLoading && !data && <Skeleton className="m-5 h-24" />}
        {error && <ErrorState message={error.message} onRetry={reload} />}
        {data && data.content.length === 0 && <EmptyState title={emptyTitle} className="py-10" />}
        {data && data.content.length > 0 && (
          <div className="md:overflow-x-auto">
            <table aria-label={label} aria-busy={isLoading || undefined} className="w-full text-left text-sm max-md:block">
              <thead className="bg-surface-subtle text-xs text-ink-muted uppercase max-md:sr-only">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.header}
                      scope="col"
                      className={cn('px-4 py-3 font-semibold whitespace-nowrap', column.className)}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line max-md:block">
                {data.content.map((row) => (
                  <tr key={rowKey(row)} className="align-top max-md:block max-md:py-3">
                    {columns.map((column, index) => {
                      const Cell = index === 0 ? 'th' : 'td'
                      return (
                        <Cell
                          key={column.header}
                          scope={index === 0 ? 'row' : undefined}
                          data-label={index === 0 ? undefined : column.header}
                          className={cn(
                            'px-4 py-3 font-normal',
                            column.className,
                            'max-md:flex max-md:items-start max-md:justify-between max-md:gap-4 max-md:py-1.5 max-md:text-right max-md:whitespace-normal',
                            index === 0
                              ? 'max-md:block max-md:pb-2 max-md:text-left'
                              : 'max-md:before:shrink-0 max-md:before:text-xs max-md:before:font-semibold max-md:before:text-ink-muted max-md:before:uppercase max-md:before:content-[attr(data-label)]',
                          )}
                        >
                          {index === 0 ? column.cell(row) : <div className="min-w-0 max-md:flex max-md:flex-wrap max-md:justify-end max-md:gap-1">{column.cell(row)}</div>}
                        </Cell>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">{data.totalElements} total</p>
          <Pagination page={page + 1} totalPages={data.totalPages} onPageChange={(next) => setPage(next - 1)} />
        </div>
      )}
    </div>
  )
}

/**
 * A modal form. `children(fieldErrors)` renders the fields, where fieldErrors maps a request
 * field to the server's validation message. The server's message for anything else (e.g. a 409
 * conflict) is shown above the buttons.
 */
export function FormDialog({ open, onClose, title, description, submitLabel = 'Save', onSubmit, size = 'lg', children }) {
  const formId = useId()
  const [state, setState] = useState({ busy: false, error: null })
  const fieldErrors = serverFieldErrors(state.error)

  const close = () => {
    setState({ busy: false, error: null })
    onClose()
  }

  const submit = async (event) => {
    event.preventDefault()
    setState({ busy: true, error: null })
    try {
      await onSubmit(new FormData(event.currentTarget))
      setState({ busy: false, error: null })
      onClose()
    } catch (error) {
      setState({ busy: false, error })
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={state.busy}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-4">
        {children(fieldErrors)}
        {state.error && Object.keys(fieldErrors).length === 0 && <Alert tone="error">{state.error.message}</Alert>}
        {state.error && Object.keys(fieldErrors).length > 0 && <Alert tone="error">Please correct the highlighted fields.</Alert>}
      </form>
    </Modal>
  )
}

/** A yes/no action with the server's error shown inline (e.g. "Cancel this show"). */
export function ConfirmDialog({ open, onClose, title, children, confirmLabel, tone = 'primary', onConfirm }) {
  const [state, setState] = useState({ busy: false, error: null })
  const close = () => {
    setState({ busy: false, error: null })
    onClose()
  }
  const confirm = async () => {
    setState({ busy: true, error: null })
    try {
      await onConfirm()
      setState({ busy: false, error: null })
      onClose()
    } catch (error) {
      setState({ busy: false, error })
    }
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Keep
          </Button>
          <Button variant={tone} onClick={confirm} loading={state.busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {children}
        {state.error && <Alert tone="error">{state.error.message}</Alert>}
      </div>
    </Modal>
  )
}

export function TextAreaField({ label, error, hint, className, rows = 4, ...props }) {
  const id = useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          'block w-full rounded-control border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-ink',
          error ? 'border-danger' : 'border-line hover:border-ink-muted',
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
