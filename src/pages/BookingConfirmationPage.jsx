import { CalendarDays, CircleCheck, MapPin, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { getBooking, getTickets } from '../api/bookingApi'
import { DownloadTicketsButton } from '../components/booking/DownloadTicketsButton'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatCurrency, formatDateTime } from '../lib/format'
import { attendanceOf } from '../lib/attendance'
import { BOOKING_STATUS } from '../lib/labels'

const TICKET_STATUS = { VALID: 'Valid', USED: 'Checked in', CANCELLED: 'Cancelled' }

/**
 * Tickets with their signed QR codes, scanned at the entrance. If the QR codes cannot be loaded the
 * ticket codes from the booking are still listed. The SVG is shown through an <img>, so it can
 * never run script.
 */
function TicketList({ reference, fallback, liveStatus }) {
  const { data, error, isLoading } = useAsync(() => getTickets(reference), [reference])
  // QR codes come from the first load; statuses follow the live booking (check-ins at the gate).
  const tickets = (data ?? fallback).map((ticket) => {
    const live = liveStatus?.get(ticket.code)
    return live ? { ...ticket, status: live.status, checkedInAt: live.checkedInAt } : ticket
  })
  return (
    <>
      {isLoading && !data && (
        <p role="status" className="px-6 pt-4 text-sm text-ink-muted">
          Loading your QR codes…
        </p>
      )}
      <ul aria-label="Tickets" className="divide-y divide-dashed divide-line">
        {tickets.map((ticket) => (
          <li key={ticket.code} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-3">
              <Ticket aria-hidden="true" size={20} className="text-primary-strong" />
              <span>
                <span className="block text-sm font-semibold text-ink">{ticket.seatLabel ? `Seat ${ticket.seatLabel}` : 'General admission'}</span>
                <span className="block font-mono text-xs tracking-wider text-ink-muted">{ticket.code}</span>
                <Badge tone={ticket.status === 'VALID' ? 'success' : 'neutral'} className="mt-2">
                  {TICKET_STATUS[ticket.status] ?? ticket.status}
                </Badge>
              </span>
            </span>
            {ticket.qrSvg && (
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(ticket.qrSvg)}`}
                alt={`QR code for ticket ${ticket.code}`}
                className="size-36 self-center rounded-lg border border-line bg-white p-1 sm:self-auto"
              />
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="px-6 pb-4 text-sm text-ink-muted">
          QR codes could not be loaded right now. Reload the page before you go, or show your booking reference at the venue.
        </p>
      )}
    </>
  )
}

const CHECK_IN_POLL_MS = 15_000
const HOUR = 3_600_000

/** True while a confirmed booking still has an unscanned ticket and the gate is open (6 h before to 4 h after). */
function shouldWatchForCheckIn(booking, now = Date.now()) {
  if (booking?.status !== 'CONFIRMED' || !booking.tickets?.some((ticket) => ticket.status === 'VALID')) return false
  const start = new Date(booking.startsAt).getTime()
  const end = new Date(booking.endsAt ?? booking.startsAt).getTime()
  return now >= start - 6 * HOUR && now <= end + 4 * HOUR
}

/** Shows exactly what the server reports for this booking; tickets only exist once it is CONFIRMED. */
export default function BookingConfirmationPage() {
  const { reference } = useParams()
  useDocumentTitle('Booking confirmation')
  const { data: loaded, isLoading, error, reload } = useAsync(() => getBooking(reference), [reference])
  const [live, setLive] = useState(null)
  const booking = live?.reference === loaded?.reference ? live : loaded
  const watching = shouldWatchForCheckIn(booking)

  // While a ticket can still be scanned at the gate, quietly re-read the booking so the page
  // switches to "Checked in" (and later "Watched") without a reload.
  useEffect(() => {
    if (!watching) return undefined
    let active = true
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      getBooking(reference)
        .then((fresh) => active && setLive(fresh))
        .catch(() => {})
    }, CHECK_IN_POLL_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [watching, reference])

  if (isLoading) return <LoadingState label="Loading your booking…" className="py-32" />
  if (error) {
    return error.code === 'NOT_FOUND' ? (
      <EmptyState title="Booking not found" message="Check the reference or open it from My bookings." action={<Button to="/my-bookings">My bookings</Button>} className="py-24" />
    ) : (
      <ErrorState message={error.message} onRetry={reload} className="py-24" />
    )
  }

  if (booking.status !== 'CONFIRMED') {
    const status = BOOKING_STATUS[booking.status]
    return (
      <EmptyState
        title={booking.status === 'PENDING' ? 'This booking is awaiting payment' : `Booking ${status.label.toLowerCase()}`}
        message={`Reference ${booking.reference}`}
        action={
          booking.status === 'PENDING' ? (
            <Button to={`/checkout/${booking.reference}`}>Complete payment</Button>
          ) : (
            <Button to="/my-bookings">My bookings</Button>
          )
        }
        className="py-24"
      />
    )
  }

  const attendance = attendanceOf(booking)

  return (
    <div className="container-page max-w-3xl py-12">
      <div className="text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-secondary-soft text-secondary-strong">
          <CircleCheck aria-hidden="true" size={32} />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
          {attendance?.state === 'ATTENDED'
            ? booking.type === 'MOVIE'
              ? 'Thanks for watching!'
              : 'Thanks for coming!'
            : attendance
              ? 'Enjoy the show!'
              : 'You’re all set!'}
        </h1>
        <p className="mt-2 text-ink-secondary">
          Booking <span className="font-mono font-semibold text-ink">{booking.reference}</span>
          {attendance ? (
            <>
              {' '}
              · {attendance.label}
              {attendance.checkedInAt && ` at the gate ${formatDateTime(attendance.checkedInAt, booking.venue.timeZone)}`}
            </>
          ) : (
            ' is confirmed.'
          )}
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-line shadow-card">
        <div className="flex flex-col gap-4 border-b border-line p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-ink">{booking.title}</h2>
            <p className="text-sm text-ink-muted">{booking.subtitle}</p>
            <div className="mt-3 space-y-1.5 text-sm text-ink-secondary">
              <p className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" size={16} className="text-ink-muted" />
                {formatDateTime(booking.startsAt, booking.venue.timeZone)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin aria-hidden="true" size={16} className="text-ink-muted" />
                {booking.venue.name}
                {booking.screenName ? ` · ${booking.screenName}` : ''}, {booking.venue.city}
              </p>
            </div>
          </div>
          <DownloadTicketsButton booking={booking} size="sm" />
        </div>
        <TicketList reference={booking.reference} fallback={booking.tickets} liveStatus={new Map(booking.tickets.map((ticket) => [ticket.code, ticket]))} />
        <div className="flex justify-between border-t border-line p-6 text-base">
          <span className="font-semibold text-ink">Total paid</span>
          <span className="font-bold text-ink">{formatCurrency(booking.total, booking.currency)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/my-bookings" variant="outline">
          My bookings
        </Button>
        <Button to="/">Back to home</Button>
      </div>
    </div>
  )
}
