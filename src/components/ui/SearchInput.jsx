import { useId, useState } from 'react'
import { Search, X } from 'lucide-react'

import { cn } from '../../lib/cn'

/**
 * Search box. Calls onSearch(term) on submit; when `onChange` is passed it also
 * reports every keystroke (for live filtering).
 */
export function SearchInput({
  defaultValue = '',
  placeholder = 'Search movies, events or venues',
  label = 'Search',
  onSearch,
  onChange,
  size = 'md',
  submitLabel,
  className,
}) {
  const [value, setValue] = useState(defaultValue)
  const inputId = useId()

  const handleChange = (event) => {
    setValue(event.target.value)
    onChange?.(event.target.value)
  }

  const clear = () => {
    setValue('')
    onChange?.('')
  }

  return (
    <form
      role="search"
      className={cn('relative flex items-center', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSearch?.(value.trim())
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <Search aria-hidden="true" size={size === 'lg' ? 20 : 18} className="pointer-events-none absolute left-4 text-ink-muted" />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'w-full rounded-full border border-line bg-surface text-ink shadow-card placeholder:text-ink-muted',
          'transition-shadow hover:shadow-elevated focus:border-ink',
          '[&::-webkit-search-cancel-button]:hidden',
          size === 'lg' ? 'h-14 pr-32 pl-12 text-base' : 'h-11 pr-10 pl-11 text-sm',
        )}
      />
      {value && size !== 'lg' && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 inline-flex size-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-subtle hover:text-ink"
        >
          <X aria-hidden="true" size={16} />
        </button>
      )}
      {size === 'lg' && (
        <button
          type="submit"
          className="absolute right-2 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          <Search aria-hidden="true" size={16} />
          {submitLabel ?? 'Search'}
        </button>
      )}
    </form>
  )
}
