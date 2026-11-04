import { CalendarDays, MapPin, Ticket } from 'lucide-react'

import { formatCurrency, formatDateTime } from '../../lib/format'
import { SEAT_TYPE } from '../../lib/labels'

/** Server-calculated summary of a booking (BookingResponse). Nothing here is computed client-side. */
export function OrderSummary({ booking }) {
  const currency = booking.currency
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h2 className="text-lg font-semibold text-ink">Order summary</h2>
      <div className="mt-4 space-y-2 border-b border-line pb-4">
        <p className="text-base font-semibold text-ink">{booking.title}</p>
        {booking.subtitle && <p className="text-sm text-ink-muted">{booking.subtitle}</p>}
        <p className="flex items-center gap-2 text-sm text-ink-secondary">
          <CalendarDays aria-hidden="true" size={16} className="shrink-0 text-ink-muted" />
          {formatDateTime(booking.startsAt, booking.venue.timeZone)}
        </p>
        <p className="flex items-center gap-2 text-sm text-ink-secondary">
          <MapPin aria-hidden="true" size={16} className="shrink-0 text-ink-muted" />
          {booking.venue.name}
          {booking.screenName ? ` · ${booking.screenName}` : ''}
        </p>
      </div>
      <ul className="space-y-2 border-b border-line py-4">
        {booking.items.map((item, index) => (
          <li key={item.seatLabel ?? `ga-${index}`} className="flex justify-between gap-4 text-sm">
            <span className="flex items-start gap-2 text-ink-secondary">
              <Ticket aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-ink-muted" />
              {item.seatLabel ? `Seat ${item.seatLabel} · ${SEAT_TYPE[item.seatType] ?? ''}` : 'General admission'}
            </span>
            <span className="font-medium text-ink">{formatCurrency(item.unitPrice, currency)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-secondary">Tickets ({booking.ticketCount})</dt>
          <dd className="font-medium text-ink">{formatCurrency(booking.subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-secondary">Booking fees</dt>
          <dd className="font-medium text-ink">{formatCurrency(booking.fees, currency)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base">
          <dt className="font-semibold text-ink">Total</dt>
          <dd className="font-bold text-ink">{formatCurrency(booking.total, currency)}</dd>
        </div>
      </dl>
    </div>
  )
}
