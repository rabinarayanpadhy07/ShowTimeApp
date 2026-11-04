import { Minus, Plus } from 'lucide-react'

export function QuantityStepper({ value, onChange, min = 1, max = 10, label = 'Quantity' }) {
  const button =
    'inline-flex size-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40'
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-3">
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
        <Minus aria-hidden="true" size={16} />
      </button>
      <output aria-live="polite" className="w-6 text-center text-base font-semibold text-ink">
        {value}
      </output>
      <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
        <Plus aria-hidden="true" size={16} />
      </button>
    </div>
  )
}
