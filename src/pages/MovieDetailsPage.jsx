import { useState } from 'react'
import { CalendarDays, Clock, Languages, MapPin, Star } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { getMovie, getMovieShowtimes } from '../api/catalogApi'
import { RatingBadge } from '../components/catalog/MovieCard'
import { PosterArt } from '../components/catalog/PosterArt'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonClasses } from '../components/ui/buttonClasses'
import { DateSelector } from '../components/ui/DateSelector'
import { SectionHeader } from '../components/ui/Section'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatCurrency, formatDuration, formatReleaseDate, formatTime, nextDateKeys } from '../lib/format'
import { paletteFor } from '../lib/palette'

const SHOW_DAYS = 7

function Showtimes({ slug }) {
  const [dates] = useState(() => nextDateKeys(SHOW_DAYS))
  const [date, setDate] = useState(dates[0])
  const { data: groups, isLoading, error, reload } = useAsync(() => getMovieShowtimes(slug, { date }), [slug, date])

  return (
    <section data-reveal id="showtimes" aria-labelledby="showtimes-heading" className="scroll-mt-28">
      <SectionHeader id="showtimes-heading" title="Showtimes" subtitle="Times are shown in each cinema's local time." />
      <DateSelector dates={dates} value={date} onChange={setDate} label="Show date" />
      <div className="mt-6">
        {isLoading && <LoadingState label="Loading showtimes…" className="py-10" />}
        {error && <ErrorState message={error.message} onRetry={reload} />}
        {groups && groups.length === 0 && (
          <EmptyState icon={CalendarDays} title="No shows on this date" message="Pick another day to see available showtimes." className="py-10" />
        )}
        {groups && groups.length > 0 && (
          <ul className="divide-y divide-line rounded-card border border-line">
            {groups.map(({ venue, showtimes }) => (
              <li key={venue.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:gap-8">
                <div className="lg:w-72 lg:shrink-0">
                  <h3 className="font-semibold text-ink">{venue.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
                    <MapPin aria-hidden="true" size={14} />
                    {venue.addressLine1}, {venue.city}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-3" aria-label={`Showtimes at ${venue.name}`}>
                  {showtimes.map((show) => (
                    <li key={show.id}>
                      <Link
                        to={`/shows/${show.id}/seats`}
                        className="flex min-w-28 flex-col items-center rounded-control border border-secondary-strong/60 px-4 py-2 text-center transition-colors hover:border-secondary-strong hover:bg-secondary-soft"
                      >
                        <span className="text-sm font-semibold text-secondary-strong">{formatTime(show.startsAt, venue.timeZone)}</span>
                        <span className="text-xs text-ink-muted">
                          {show.formatLabel} · {show.screenName}
                        </span>
                        <span className="sr-only">, tickets from {formatCurrency(show.basePrice)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Reviews({ reviews, rating }) {
  return (
    <section data-reveal aria-labelledby="reviews-heading">
      <SectionHeader
        id="reviews-heading"
        title="Reviews"
        subtitle={rating ? `${Number(rating.average).toFixed(1)} average from ${rating.count} reviews` : undefined}
      />
      {reviews.length === 0 ? (
        <p className="text-sm text-ink-muted">No reviews yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-card border border-line p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{review.title}</p>
                <span className="inline-flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} aria-hidden="true" size={14} className={index < review.rating ? 'fill-ink text-ink' : 'text-line'} />
                  ))}
                </span>
              </div>
              {review.comment && <p className="mt-2 text-sm text-ink-secondary">{review.comment}</p>}
              <p className="mt-3 text-xs text-ink-muted">{review.author}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function MovieDetailsPage() {
  const { slug } = useParams()
  const { data: movie, isLoading, error, reload } = useAsync(() => getMovie(slug), [slug])
  useDocumentTitle(movie?.title ?? 'Movie')

  if (isLoading) {
    return (
      <div className="container-page grid gap-8 py-10 md:grid-cols-[16rem_1fr]">
        <Skeleton className="aspect-[2/3] w-full rounded-card" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return error.code === 'NOT_FOUND' ? (
      <EmptyState title="Movie not found" message="This movie may have finished its run." action={<Button to="/movies">Browse movies</Button>} className="py-24" />
    ) : (
      <ErrorState message={error.message} onRetry={reload} className="py-24" />
    )
  }

  const comingSoon = movie.status === 'COMING_SOON'

  return (
    <>
      <div className="border-b border-line bg-surface-subtle">
        <div className="container-page grid gap-8 py-10 md:grid-cols-[16rem_1fr] md:items-center">
          <PosterArt title={movie.title} palette={paletteFor(movie.slug)} imageUrl={movie.posterUrl} className="mx-auto w-48 shadow-elevated md:w-full" />
          <div>
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <Badge key={genre.slug} tone="outline">
                  {genre.name}
                </Badge>
              ))}
              {movie.newRelease && <Badge tone="promo">New release</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{movie.title}</h1>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-secondary">
              {movie.certification && <li className="font-semibold text-ink">{movie.certification}</li>}
              <li className="inline-flex items-center gap-1.5">
                <Clock aria-hidden="true" size={16} className="text-ink-muted" />
                {formatDuration(movie.durationMinutes)}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Languages aria-hidden="true" size={16} className="text-ink-muted" />
                {movie.language}
              </li>
              {movie.releaseDate && (
                <li className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" size={16} className="text-ink-muted" />
                  {comingSoon ? 'Releases' : 'Released'} {formatReleaseDate(movie.releaseDate)}
                </li>
              )}
              {movie.rating && (
                <li>
                  <RatingBadge rating={movie.rating} />
                </li>
              )}
            </ul>
            {movie.synopsis && <p className="mt-5 max-w-2xl text-base text-ink-secondary">{movie.synopsis}</p>}
            <dl className="mt-5 grid max-w-2xl gap-3 text-sm sm:grid-cols-2">
              {movie.director && (
                <div>
                  <dt className="text-ink-muted">Director</dt>
                  <dd className="font-medium text-ink">{movie.director}</dd>
                </div>
              )}
              {movie.cast.length > 0 && (
                <div>
                  <dt className="text-ink-muted">Cast</dt>
                  <dd className="font-medium text-ink">{movie.cast.join(', ')}</dd>
                </div>
              )}
            </dl>
            {!comingSoon && (
              <a
                href="#showtimes"
                className={buttonClasses({ size: 'lg', className: 'mt-7' })}
                onClick={(event) => {
                  const target = document.getElementById('showtimes')
                  if (!target) return
                  event.preventDefault()
                  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
                  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
                  window.history.replaceState(null, '', '#showtimes')
                }}
              >
                Book tickets
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container-page space-y-14 py-12">
        {comingSoon ? (
          <Alert title="Tickets aren't on sale yet">
            Bookings for {movie.title} open closer to its release
            {movie.releaseDate ? ` on ${formatReleaseDate(movie.releaseDate)}` : ''}.
          </Alert>
        ) : (
          <Showtimes slug={movie.slug} />
        )}
        <Reviews reviews={movie.reviews} rating={movie.rating} />
      </div>
    </>
  )
}
