import { useState } from 'react'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import { Link } from 'react-router'

import { cancelBooking, getCancellationPreview, listMyBookings } from '../api/bookingApi'
import { DownloadTicketsButton } from '../components/booking/DownloadTicketsButton'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { PageHeader } from '../components/ui/Section'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatCurrency, formatDateTime, pluralize } from '../lib/format'
import { attendanceOf } from '../lib/attendance'
import { BOOKING_STATUS } from '../lib/labels'

const REFUND_STATUS = { PENDING: 'processing', PROCESSED: 'processed', FAILED: 'delayed, our team is on it' }

function BookingRow({ booking, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const status = BOOKING_STATUS[booking.status]
  const attendance = attendanceOf(booking)
  const link =
    booking.status === 'CONFIRMED'
      ? `/bookings/${booking.reference}/confirmation`
      : booking.status === 'PENDING'
        ? `/checkout/${booking.reference}`
        : null

  const refund = booking.refunds?.[0]

  const cancel = async () => {
    setBusy(true)
    setError(null)
    try {
      // The server's policy decides the refund; show it before asking for confirmation.
      const preview = await getCancellationPreview(booking.reference)
      if (!preview.allowed) {
        setError(new Error(preview.message))
        setBusy(false)
        return
      }
      const refundLine =
        booking.status === 'CONFIRMED' ? `\nRefund: ${formatCurrency(preview.refundAmount, preview.currency)}.` : ''
      if (!window.confirm(`${preview.message}${refundLine}\n\nCancel booking ${booking.reference}?`)) {
        setBusy(false)
        return
      }
      await cancelBooking(booking.reference)
      onChanged()
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <li data-reveal className="flex flex-col gap-4 rounded-card border border-line p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-ink">{booking.title}</h2>
          {attendance ? <Badge tone="success">{attendance.label}</Badge> : <Badge tone={status.tone}>{status.label}</Badge>}
        </div>
        <p className="flex items-center gap-2 text-sm text-ink-secondary">
          <CalendarDays aria-hidden="true" size={15} className="text-ink-muted" />
          {formatDateTime(booking.startsAt, booking.venue.timeZone)}
        </p>
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <MapPin aria-hidden="true" size={15} />
          {booking.venue.name}
          {booking.items.some((item) => item.seatLabel) &&
            ` · Seats ${booking.items.map((item) => item.seatLabel).filter(Boolean).join(', ')}`}
        </p>
        <p className="text-xs text-ink-muted">
          {booking.reference} · {pluralize(booking.ticketCount, 'ticket')} · {formatCurrency(booking.total, booking.currency)}
        </p>
        {refund && (
          <p className="text-xs font-medium text-ink-secondary">
            Refund of {formatCurrency(refund.amount, booking.currency)}: {REFUND_STATUS[refund.status] ?? refund.status}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error.message}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-start gap-2">
        {booking.cancellable && !attendance && (
          <Button variant="ghost" size="sm" onClick={cancel} loading={busy}>
            Cancel
          </Button>
        )}
        {booking.status === 'CONFIRMED' && <DownloadTicketsButton booking={booking} variant="ghost" size="sm" label="Download" />}
        {link && (
          <Button to={link} variant={booking.status === 'PENDING' ? 'primary' : 'outline'} size="sm">
            {booking.status === 'PENDING' ? 'Complete payment' : 'View tickets'}
          </Button>
        )}
      </div>
    </li>
  )
}

export default function MyBookingsPage() {
  useDocumentTitle('My bookings')
  const [page, setPage] = useState(0)
  const { data, isLoading, error, reload } = useAsync(() => listMyBookings({ page, size: 10 }), [page])

  return (
    <>
      <PageHeader title="My bookings" subtitle="Upcoming and past tickets for movies and events." />
      <div className="container-page py-10">
        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-28 w-full rounded-card" />
            ))}
          </div>
        )}
        {error && <ErrorState message={error.message} onRetry={reload} />}
        {data && data.content.length === 0 && (
          <EmptyState
            icon={Ticket}
            title="No bookings yet"
            message="When you book a movie or event, your tickets will appear here."
            action={
              <>
                <Button to="/movies">Browse movies</Button>
                <Button to="/events" variant="outline">
                  Browse events
                </Button>
              </>
            }
          />
        )}
        {data && data.content.length > 0 && (
          <>
            <ul className="space-y-4">
              {data.content.map((booking) => (
                <BookingRow key={booking.reference} booking={booking} onChanged={reload} />
              ))}
            </ul>
            <Pagination className="mt-10" page={data.page + 1} totalPages={data.totalPages} onPageChange={(next) => setPage(next - 1)} />
            <p className="mt-6 text-center text-xs text-ink-muted">
              Need help with a booking? Quote its reference, e.g. <Link to="/my-bookings" className="underline">{data.content[0].reference}</Link>.
            </p>
          </>
        )}
      </div>
    </>
  )
}
