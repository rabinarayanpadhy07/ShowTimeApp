import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '../../lib/cn'

const controlBase =
  'block w-full rounded-control border bg-surface text-ink placeholder:text-ink-muted transition-colors ' +
  'focus:border-ink ' +
  'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-muted'

function FieldShell({ id, label, hint, error, required, children, className }) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-primary-strong">
              *
            </span>
          )}
        </label>
      )}
      {children({ describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export function TextField({ label, hint, error, required, icon: Icon, className, inputClassName, id, ...props }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} required={required} className={className}>
      {({ describedBy }) => (
        <div className="relative">
          {Icon && (
            <Icon aria-hidden="true" size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
          )}
          <input
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              controlBase,
              'h-11 px-3 text-sm',
              Icon && 'pl-10',
              error ? 'border-danger' : 'border-line hover:border-ink-muted',
              inputClassName,
            )}
            {...props}
          />
        </div>
      )}
    </FieldShell>
  )
}

export function SelectField({ label, hint, error, required, options, placeholder, className, id, ...props }) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return (
    <FieldShell id={selectId} label={label} hint={hint} error={error} required={required} className={className}>
      {({ describedBy }) => (
        <div className="relative">
          <select
            id={selectId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              controlBase,
              'h-11 appearance-none pr-10 pl-3 text-sm',
              error ? 'border-danger' : 'border-line hover:border-ink-muted',
            )}
            {...props}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted" />
        </div>
      )}
    </FieldShell>
  )
}

export function Checkbox({ label, description, className, id, ...props }) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        id={checkboxId}
        type="checkbox"
        className="mt-0.5 size-4.5 shrink-0 cursor-pointer rounded border-line accent-ink"
        {...props}
      />
      <label htmlFor={checkboxId} className="cursor-pointer text-sm text-ink-secondary">
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-ink-muted">{description}</span>}
      </label>
    </div>
  )
}
