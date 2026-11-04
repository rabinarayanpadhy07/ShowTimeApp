import { CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router'

import { formatCurrency, formatDateTime } from '../../lib/format'
import { paletteFor } from '../../lib/palette'
import { Badge } from '../ui/Badge'
import { iconForCategory } from './categoryIcons'
import { PosterArt } from './PosterArt'

/** Event card (EventSummaryResponse from the API). */
export function EventCard({ event }) {
  const venue = event.nextVenue
  return (
    <article data-reveal className="group relative">
      <PosterArt
        title={event.title}
        palette={paletteFor(event.slug)}
        icon={iconForCategory(event.category)}
        imageUrl={event.imageUrl}
        aspect="landscape"
        className="shadow-card transition-shadow group-hover:shadow-elevated"
      >
        <div className="absolute top-3 left-3">
          <Badge tone="dark">{event.categoryLabel}</Badge>
        </div>
      </PosterArt>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-1 text-base font-semibold text-ink">
          <Link to={`/events/${event.slug}`} className="after:absolute after:inset-0 after:rounded-card">
            {event.title}
          </Link>
        </h3>
        {event.nextStartsAt && (
          <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
            <CalendarDays aria-hidden="true" size={15} className="shrink-0 text-ink-muted" />
            {formatDateTime(event.nextStartsAt, venue?.timeZone)}
            {event.upcomingDates > 1 && <span className="text-ink-muted">+{event.upcomingDates - 1} more</span>}
          </p>
        )}
        {venue && (
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            <MapPin aria-hidden="true" size={15} className="shrink-0" />
            <span className="line-clamp-1">
              {venue.name}, {venue.city}
            </span>
          </p>
        )}
        {event.priceFrom != null && (
          <p className="pt-0.5 text-sm text-ink">
            <span className="font-semibold">{formatCurrency(event.priceFrom)}</span>
            <span className="text-ink-muted"> onwards</span>
          </p>
        )}
      </div>
    </article>
  )
}
