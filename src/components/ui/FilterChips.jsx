import { cn } from '../../lib/cn'

/**
 * Single-select chip group. `value` '' selects the "All" chip.
 * Rendered as toggle buttons (aria-pressed) inside a labelled group.
 */
export function FilterChips({ label, options, value, onChange, allLabel = 'All', className }) {
  const items = [{ value: '', label: allLabel }, ...options]
  return (
    <div role="group" aria-label={label} className={cn('scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1', className)}>
      {items.map((option) => {
        const selected = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value || 'all'}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors',
              selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink',
            )}
          >
            {Icon && <Icon aria-hidden="true" size={16} />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
