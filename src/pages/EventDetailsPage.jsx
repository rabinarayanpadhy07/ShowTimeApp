import { useState } from 'react'
import { Armchair, CalendarDays, Clock, Languages, MapPin, ShieldCheck, Users } from 'lucide-react'
import { useParams } from 'react-router'

import { getScheduleInventory } from '../api/bookingApi'
import { getEvent } from '../api/catalogApi'
import { iconForCategory } from '../components/catalog/categoryIcons'
import { PosterArt } from '../components/catalog/PosterArt'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { SectionHeader } from '../components/ui/Section'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useHoldInventory } from '../hooks/useHoldInventory'
import { formatCurrency, formatDate, formatDuration, formatTime } from '../lib/format'
import { paletteFor } from '../lib/palette'

function GeneralAdmissionPicker({ schedule }) {
  const inventory = useAsync(() => getScheduleInventory(schedule.id), [schedule.id])
  const [quantity, setQuantity] = useState(1)
  const { hold, submitting, error } = useHoldInventory()

  if (inventory.isLoading) return <Skeleton className="h-10 w-48" />
  if (inventory.error) return <p className="text-sm text-danger">{inventory.error.message}</p>

  const { remaining, maxPerBooking, bookable } = inventory.data
  if (!bookable || remaining === 0) {
    return <Badge tone="neutral">{remaining === 0 ? 'Sold out' : 'Not on sale'}</Badge>
  }
  const max = Math.min(maxPerBooking, remaining)

  return (
    <div className="flex flex-col items-stretch gap-2 md:items-end">
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <QuantityStepper value={Math.min(quantity, max)} onChange={setQuantity} max={max} label="Tickets" />
        <Button
          onClick={() => hold({ eventScheduleId: schedule.id, quantity: Math.min(quantity, max) })}
          loading={submitting}
          className="md:w-40"
        >
          Get tickets
        </Button>
      </div>
      <p className="text-xs text-ink-muted">
        {remaining <= 20 ? (
          <span className="font-medium text-accent-strong">Only {remaining} left</span>
        ) : (
          `${remaining} available`
        )}
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error.message}
        </p>
      )}
    </div>
  )
}

function ScheduleRow({ schedule }) {
  const { venue } = schedule
  const reserved = schedule.seatingType === 'RESERVED'
  return (
    <li className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-4">
        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-card bg-surface-subtle py-2">
          <span className="text-xs font-medium text-ink-muted uppercase">
            {formatDate(schedule.startsAt, venue.timeZone, { weekday: 'short', day: undefined, month: undefined })}
          </span>
          <span className="text-xl leading-tight font-bold text-ink">
            {formatDate(schedule.startsAt, venue.timeZone, { weekday: undefined, month: undefined })}
          </span>
          <span className="text-xs text-ink-muted">
            {formatDate(schedule.startsAt, venue.timeZone, { weekday: undefined, day: undefined })}
          </span>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-ink">
            {formatTime(schedule.startsAt, venue.timeZone)} · {venue.name}
          </p>
          <p className="flex items-center gap-1 text-sm text-ink-muted">
            <MapPin aria-hidden="true" size={14} />
            {venue.addressLine1}, {venue.city}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge tone="outline" icon={reserved ? Armchair : Users}>
              {reserved ? 'Reserved seating' : 'General admission'}
            </Badge>
            <span className="text-sm text-ink">
              <span className="font-semibold">{formatCurrency(schedule.basePrice)}</span>
              {schedule.premiumPrice && <span className="text-ink-muted"> – {formatCurrency(schedule.premiumPrice)}</span>}
            </span>
          </div>
        </div>
      </div>
      {reserved ? (
        <Button to={`/event-schedules/${schedule.id}/seats`} className="md:w-40">
          Select seats
        </Button>
      ) : (
        <GeneralAdmissionPicker schedule={schedule} />
      )}
    </li>
  )
}

export default function EventDetailsPage() {
  const { slug } = useParams()
  const { data: event, isLoading, error, reload } = useAsync(() => getEvent(slug), [slug])
  useDocumentTitle(event?.title ?? 'Event')

  if (isLoading) {
    return (
      <div className="container-page space-y-6 py-10">
        <Skeleton className="aspect-[16/6] w-full rounded-2xl" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return error.code === 'NOT_FOUND' ? (
      <EmptyState title="Event not found" message="This event may have ended or been removed." action={<Button to="/events">Browse events</Button>} className="py-24" />
    ) : (
      <ErrorState message={error.message} onRetry={reload} className="py-24" />
    )
  }

  return (
    <>
      <div className="container-page pt-8">
        <PosterArt
          title={event.title}
          palette={paletteFor(event.slug)}
          icon={iconForCategory(event.category)}
          imageUrl={event.imageUrl}
          aspect="wide"
          className="max-h-96 w-full sm:aspect-[16/6]"
        />
      </div>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-12">
          <div>
            <Badge tone="primary">{event.categoryLabel}</Badge>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{event.title}</h1>
            {event.organizerName && <p className="mt-1 text-sm text-ink-muted">Presented by {event.organizerName}</p>}
            {event.description && <p className="mt-5 max-w-2xl text-base text-ink-secondary">{event.description}</p>}
          </div>

          <section data-reveal aria-labelledby="dates-heading">
            <SectionHeader id="dates-heading" title="Dates & venues" subtitle="Times are shown in the venue's local time." />
            {event.schedules.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No upcoming dates" message="Check back soon for new dates." className="rounded-card border border-line" />
            ) : (
              <ul className="divide-y divide-line rounded-card border border-line">
                {event.schedules.map((schedule) => (
                  <ScheduleRow key={schedule.id} schedule={schedule} />
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside aria-label="Event information" className="h-fit space-y-4 lg:sticky lg:top-28">
          <div className="rounded-card border border-line p-6">
            <h2 className="text-base font-semibold text-ink">Good to know</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-secondary">
              {event.durationMinutes && (
                <li className="flex items-center gap-3">
                  <Clock aria-hidden="true" size={18} className="text-ink-muted" />
                  Approx. {formatDuration(event.durationMinutes)}
                </li>
              )}
              {event.language && (
                <li className="flex items-center gap-3">
                  <Languages aria-hidden="true" size={18} className="text-ink-muted" />
                  {event.language}
                </li>
              )}
              <li className="flex items-center gap-3">
                <ShieldCheck aria-hidden="true" size={18} className="text-ink-muted" />
                {event.minAge ? `Ages ${event.minAge}+ (ID may be checked)` : 'All ages welcome'}
              </li>
              {event.priceFrom != null && (
                <li className="border-t border-line pt-3 text-ink">
                  Tickets from <span className="font-semibold">{formatCurrency(event.priceFrom)}</span>
                </li>
              )}
            </ul>
          </div>
          <Alert>Tickets are held for you for 10 minutes while you pay.</Alert>
        </aside>
      </div>
    </>
  )
}
