import { Fragment } from 'react'
import { Accessibility } from 'lucide-react'

import { cn } from '../../lib/cn'
import { formatCurrency } from '../../lib/format'

const TYPE_LABELS = { STANDARD: 'Standard', PREMIUM: 'Premium', RECLINER: 'Recliner', ACCESSIBLE: 'Accessible' }

/** Groups consecutive rows that share a price so each tier gets one heading. */
function priceTiers(rows) {
  const tiers = []
  rows.forEach((row) => {
    const price = row.seats.find((seat) => seat.type !== 'ACCESSIBLE')?.price ?? row.seats[0]?.price
    const type = row.seats.find((seat) => seat.type !== 'ACCESSIBLE')?.type ?? 'STANDARD'
    const last = tiers[tiers.length - 1]
    if (last && last.price === price && last.type === type) last.rows.push(row)
    else tiers.push({ price, type, rows: [row] })
  })
  return tiers
}

function Seat({ seat, selected, disabled, onToggle, currency }) {
  const unavailable = seat.status !== 'AVAILABLE'
  const state = unavailable ? 'unavailable' : selected ? 'selected' : 'available'
  return (
    <button
      type="button"
      onClick={() => onToggle(seat)}
      disabled={unavailable || disabled}
      aria-pressed={unavailable ? undefined : selected}
      aria-label={`Seat ${seat.label}, ${TYPE_LABELS[seat.type]}, ${formatCurrency(seat.price, currency)}, ${state}`}
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-t-lg rounded-b-sm border text-[10px] font-semibold transition-colors sm:size-8 sm:text-[11px]',
        state === 'available' && 'border-secondary-strong bg-surface text-secondary-strong hover:bg-secondary-soft',
        state === 'selected' && 'border-secondary bg-secondary text-on-secondary',
        state === 'unavailable' && 'cursor-not-allowed border-line bg-line/70 text-transparent',
        disabled && !selected && !unavailable && 'cursor-not-allowed opacity-40 hover:bg-surface',
      )}
    >
      {seat.type === 'ACCESSIBLE' && !unavailable ? <Accessibility aria-hidden="true" size={14} /> : <span aria-hidden="true">{seat.number}</span>}
    </button>
  )
}

/**
 * Seat map for one show. Seats are toggle buttons; aisles are gaps after the
 * seat numbers in `aisleAfter`. Selection limits are enforced by the parent via
 * `maxReached`.
 */
export function SeatMap({ rows, aisleAfter = [], selectedIds, onToggle, maxReached = false, currency = 'INR', screenLabel = 'Screen' }) {
  const selected = new Set(selectedIds)
  return (
    <div className="overflow-x-auto pb-2">
      {/* w-max + mx-auto centres the hall; when it is wider than the screen it scrolls instead. */}
      <div className="mx-auto w-max px-2">
        <div aria-hidden="true" className="mx-auto mb-10 w-full max-w-lg px-6">
          <div className="h-2 rounded-[50%] bg-gradient-to-r from-line via-ink-muted to-line shadow-[0_6px_14px_rgb(0_0_0/0.12)]" />
          <p className="mt-3 text-center text-xs font-medium tracking-widest text-ink-muted uppercase">{screenLabel} this way</p>
        </div>
        <div className="space-y-6">
          {priceTiers(rows).map((tier) => (
            <section key={tier.rows[0].label} aria-label={`${TYPE_LABELS[tier.type]} seats, ${formatCurrency(tier.price, currency)}`}>
              <h3 className="mb-3 border-b border-line pb-2 text-center text-xs font-semibold tracking-wide text-ink-muted uppercase">
                {TYPE_LABELS[tier.type]} · {formatCurrency(tier.price, currency)}
              </h3>
              <div className="space-y-1.5">
                {tier.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-center gap-1.5">
                    <span aria-hidden="true" className="w-5 shrink-0 text-center text-xs font-semibold text-ink-muted">
                      {row.label}
                    </span>
                    <div role="group" aria-label={`Row ${row.label}`} className="flex items-center gap-1.5">
                      {row.seats.map((seat) => (
                        <Fragment key={seat.id}>
                          <Seat
                            seat={seat}
                            selected={selected.has(seat.id)}
                            disabled={maxReached && !selected.has(seat.id)}
                            onToggle={onToggle}
                            currency={currency}
                          />
                          {aisleAfter.includes(seat.number) && <span aria-hidden="true" className="w-4 shrink-0 sm:w-6" />}
                        </Fragment>
                      ))}
                    </div>
                    {/* Mirrors the row label so the seats themselves sit on the centre line. */}
                    <span aria-hidden="true" className="w-5 shrink-0 text-center text-xs font-semibold text-ink-muted">
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SeatLegend() {
  const item = 'inline-flex items-center gap-2 text-xs text-ink-secondary'
  const swatch = 'inline-block size-4 rounded-t-md rounded-b-sm border'
  return (
    <ul aria-label="Seat legend" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      <li className={item}>
        <span className={cn(swatch, 'border-secondary-strong bg-surface')} /> Available
      </li>
      <li className={item}>
        <span className={cn(swatch, 'border-secondary bg-secondary')} /> Selected
      </li>
      <li className={item}>
        <span className={cn(swatch, 'border-line bg-line/70')} /> Unavailable
      </li>
      <li className={item}>
        <Accessibility aria-hidden="true" size={16} className="text-secondary-strong" /> Accessible
      </li>
    </ul>
  )
}
