import { cn } from '../../lib/cn'

function parts(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`)
  const format = (options) => new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', ...options }).format(date)
  return { weekday: format({ weekday: 'short' }), day: format({ day: 'numeric' }), month: format({ month: 'short' }) }
}

/** Horizontal day picker. `dates` are YYYY-MM-DD keys; the first one is labelled "Today". */
export function DateSelector({ dates, value, onChange, label = 'Choose a date', className }) {
  return (
    <div role="group" aria-label={label} className={cn('scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1', className)}>
      {dates.map((dateKey, index) => {
        const { weekday, day, month } = parts(dateKey)
        const selected = dateKey === value
        const dayLabel = index === 0 ? 'Today' : weekday
        return (
          <button
            key={dateKey}
            type="button"
            aria-pressed={selected}
            aria-label={`${index === 0 ? 'Today, ' : ''}${weekday} ${day} ${month}`}
            onClick={() => onChange(dateKey)}
            className={cn(
              'flex w-16 shrink-0 flex-col items-center rounded-card border py-2 transition-colors',
              selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink',
            )}
          >
            <span className={cn('text-xs font-medium', selected ? 'text-white/80' : 'text-ink-muted')}>{dayLabel}</span>
            <span className="text-lg leading-tight font-bold">{day}</span>
            <span className={cn('text-xs', selected ? 'text-white/80' : 'text-ink-muted')}>{month}</span>
          </button>
        )
      })}
    </div>
  )
}
