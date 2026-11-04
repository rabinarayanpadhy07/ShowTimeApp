import { Star } from 'lucide-react'
import { Link } from 'react-router'

import { formatDuration, formatReleaseDate } from '../../lib/format'
import { paletteFor } from '../../lib/palette'
import { Badge } from '../ui/Badge'
import { PosterArt } from './PosterArt'

export function RatingBadge({ rating }) {
  if (!rating) return null
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
      <Star aria-hidden="true" size={14} className="fill-ink text-ink" />
      {Number(rating.average).toFixed(1)}
      <span className="sr-only">out of 5 from {rating.count} reviews</span>
    </span>
  )
}

/** Poster card linking to the movie details page (MovieSummaryResponse from the API). */
export function MovieCard({ movie }) {
  const comingSoon = movie.status === 'COMING_SOON'
  return (
    <article data-reveal className="group relative">
      <PosterArt title={movie.title} palette={paletteFor(movie.slug)} imageUrl={movie.posterUrl} className="shadow-card transition-shadow group-hover:shadow-elevated">
        <div className="absolute top-3 left-3 flex gap-1.5">
          {movie.newRelease && (
            <Badge tone="promo" className="border-transparent">
              New release
            </Badge>
          )}
          {comingSoon && <Badge tone="dark">Coming soon</Badge>}
        </div>
      </PosterArt>
      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-ink">
            <Link to={`/movies/${movie.slug}`} className="after:absolute after:inset-0 after:rounded-card">
              {movie.title}
            </Link>
          </h3>
          <RatingBadge rating={movie.rating} />
        </div>
        <p className="line-clamp-1 text-sm text-ink-muted">
          {movie.genres.map((genre) => genre.name).join(', ')}
          {movie.genres.length > 0 && ' · '}
          {movie.language}
        </p>
        <p className="text-sm text-ink-muted">
          {comingSoon && movie.releaseDate
            ? `Releases ${formatReleaseDate(movie.releaseDate)}`
            : [movie.certification, formatDuration(movie.durationMinutes)].filter(Boolean).join(' · ')}
        </p>
      </div>
    </article>
  )
}
