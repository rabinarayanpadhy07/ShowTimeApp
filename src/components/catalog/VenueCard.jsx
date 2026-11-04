import { Building2, Clapperboard, Drama, Music, Tent } from 'lucide-react'
import { Link } from 'react-router'

const TYPE_LABELS = {
  CINEMA: 'Cinema',
  AUDITORIUM: 'Auditorium',
  ARENA: 'Arena',
  STADIUM: 'Stadium',
  CLUB: 'Club',
  OPEN_AIR: 'Open-air venue',
  OTHER: 'Venue',
}

const TYPE_ICONS = { CINEMA: Clapperboard, AUDITORIUM: Drama, CLUB: Music, OPEN_AIR: Tent }

function venueTypeLabel(type) {
  return TYPE_LABELS[type] ?? 'Venue'
}

export function VenueCard({ venue }) {
  const Icon = TYPE_ICONS[venue.type] ?? Building2
  return (
    <article data-reveal className="group relative flex items-center gap-4 rounded-card border border-line bg-surface p-4 transition-shadow hover:shadow-elevated">
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-ink">
        <Icon aria-hidden="true" size={22} />
      </span>
      <div className="min-w-0">
        <h3 className="line-clamp-1 text-sm font-semibold text-ink">
          <Link to={`/search?q=${encodeURIComponent(venue.name)}`} className="after:absolute after:inset-0 after:rounded-card">
            {venue.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          {venueTypeLabel(venue.type)} · {venue.city}
        </p>
      </div>
    </article>
  )
}
