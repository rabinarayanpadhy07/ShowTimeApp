import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Info, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { getScheduleInventory, getShowInventory, quote as requestQuote } from '../api/bookingApi'
import { SeatLegend, SeatMap } from '../components/booking/SeatMap'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useHoldInventory } from '../hooks/useHoldInventory'
import { formatCurrency, formatDateTime, pluralize } from '../lib/format'

const SEAT_GUIDE = [
  { type: 'Standard', text: 'Regular seating at the base ticket price.' },
  { type: 'Premium', text: 'Rows with the best sightlines, charged at the premium price.' },
  { type: 'Recliner', text: 'Fully reclining lounge seats, charged at the premium price.' },
  { type: 'Accessible', text: 'Wheelchair-accessible spaces with a companion seat nearby.' },
]

/** Aisles are not stored in the seat map yet; split wide rows into blocks for readability. */
function aislesFor(rows) {
  const width = Math.max(0, ...rows.map((row) => row.seats.length))
  if (width >= 14) return [Math.floor(width / 4), width - Math.floor(width / 4)]
  if (width >= 8) return [Math.floor(width / 2)]
  return []
}

/** Server-side price for the current selection, refreshed as seats are toggled. */
function useQuote(selection) {
  const [state, setState] = useState({ quote: null, error: null })
  const key = selection ? JSON.stringify(selection) : null
  useEffect(() => {
    if (!key) return undefined
    let active = true
    const timer = setTimeout(() => {
      requestQuote(JSON.parse(key)).then(
        (quote) => active && setState({ quote, error: null }),
        (error) => active && setState({ quote: null, error }),
      )
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [key])
  return key ? state : { quote: null, error: null }
}

/** Seat picker for a movie show (kind="movie") or a reserved-seating event schedule (kind="event"). */
export default function SeatSelectionPage({ kind }) {
  const { id } = useParams()
  const [selectedIds, setSelectedIds] = useState([])
  const [guideOpen, setGuideOpen] = useState(false)
  const loadInventory = kind === 'movie' ? getShowInventory : getScheduleInventory
  const { data: show, isLoading, error, reload } = useAsync(() => loadInventory(id), [kind, id])
  const { hold, submitting, error: holdError, clearError } = useHoldInventory()
  useDocumentTitle(show ? `Seats · ${show.title}` : 'Select seats')

  const selection =
    selectedIds.length > 0
      ? kind === 'movie'
        ? { movieShowId: Number(id), seatIds: [...selectedIds].sort((a, b) => a - b) }
        : { eventScheduleId: Number(id), seatIds: [...selectedIds].sort((a, b) => a - b) }
      : null
  const { quote, error: quoteError } = useQuote(selection)

  if (isLoading && !show) return <LoadingState label="Loading seat map…" className="py-32" />
  if (error) {
    return error.code === 'NOT_FOUND' ? (
      <EmptyState title="Show not found" message="This show may no longer be available." action={<Button to="/movies">Browse movies</Button>} className="py-24" />
    ) : (
      <ErrorState message={error.message} onRetry={reload} className="py-24" />
    )
  }

  const seats = show.rows.flatMap((row) => row.seats)
  const selectedSeats = seats.filter((seat) => selectedIds.includes(seat.id))
  const maxReached = selectedIds.length >= show.maxPerBooking
  const backTo = kind === 'movie' ? `/movies/${show.parentSlug}` : `/events/${show.parentSlug}`

  const toggleSeat = (seat) => {
    clearError()
    setSelectedIds((current) => (current.includes(seat.id) ? current.filter((seatId) => seatId !== seat.id) : [...current, seat.id]))
  }

  return (
    <>
      <div className="border-b border-line">
        <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link to={backTo} aria-label="Back" className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-subtle">
              <ArrowLeft aria-hidden="true" size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">{show.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-secondary">
                <span>{show.subtitle}</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" size={15} className="text-ink-muted" />
                  {formatDateTime(show.startsAt, show.venue.timeZone)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden="true" size={15} className="text-ink-muted" />
                  {show.venue.name}
                  {show.screenName ? ` · ${show.screenName}` : ''}
                </span>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" leftIcon={Info} onClick={() => setGuideOpen(true)}>
            Seat guide
          </Button>
        </div>
      </div>

      <div className="container-page py-8 pb-44">
        {!show.bookable && (
          <Alert tone="warning" title="This show is no longer open for booking" className="mb-6" />
        )}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <SeatLegend />
          <p className="text-sm text-ink-muted">
            Up to {show.maxPerBooking} seats · held for {show.holdMinutes} minutes while you pay
          </p>
        </div>
        <SeatMap
          rows={show.rows}
          aisleAfter={aislesFor(show.rows)}
          selectedIds={selectedIds}
          onToggle={toggleSeat}
          maxReached={maxReached || !show.bookable}
          currency={show.currency}
          screenLabel={kind === 'movie' ? 'Screen' : 'Stage'}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface shadow-sticky">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <div aria-live="polite" className="min-w-0">
            {selectedSeats.length === 0 ? (
              <p className="text-sm text-ink-muted">Select your seats to continue</p>
            ) : (
              <>
                <p className="text-base font-bold text-ink">
                  {quote ? formatCurrency(quote.total, quote.currency) : 'Calculating…'}
                  {quote && <span className="ml-2 text-xs font-normal text-ink-muted">incl. {formatCurrency(quote.fees, quote.currency)} fees</span>}
                </p>
                <p className="truncate text-sm text-ink-secondary">
                  {pluralize(selectedSeats.length, 'seat')}: {selectedSeats.map((seat) => seat.label).join(', ')}
                </p>
              </>
            )}
            {maxReached && <p className="text-xs font-medium text-accent-strong">Seat limit reached</p>}
            {(holdError || quoteError) && (
              <p role="alert" className="text-sm font-medium text-danger">
                {(holdError || quoteError).message}
              </p>
            )}
          </div>
          <Button
            size="lg"
            // After a conflict, reload the seat map so newly taken seats show as unavailable.
            onClick={() => hold(selection, { onConflict: () => { setSelectedIds([]); reload() } })}
            disabled={!selection || !show.bookable} loading={submitting}>
            Hold seats
          </Button>
        </div>
      </div>

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Seat guide" description="What each seat type means at this venue.">
        <dl className="space-y-4">
          {SEAT_GUIDE.map((item) => (
            <div key={item.type}>
              <dt className="font-semibold text-ink">{item.type}</dt>
              <dd className="mt-0.5">{item.text}</dd>
            </div>
          ))}
        </dl>
      </Modal>
    </>
  )
}
