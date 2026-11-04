import { CalendarX, Clapperboard, Clock, Languages } from 'lucide-react'
import { Link } from 'react-router'

import { listEventCategories, listEvents, listMovies, listVenues } from '../api/catalogApi'
import { iconForCategory } from '../components/catalog/categoryIcons'
import { EventCard } from '../components/catalog/EventCard'
import { MovieCard, RatingBadge } from '../components/catalog/MovieCard'
import { PosterArt } from '../components/catalog/PosterArt'
import { PosterRow } from '../components/catalog/PosterWall'
import { VenueCard } from '../components/catalog/VenueCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SectionHeader } from '../components/ui/Section'
import { CardGridSkeleton, Skeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDuration } from '../lib/format'
import { paletteFor } from '../lib/palette'

/** Repeats a short list so the poster wall always overflows its frame. */
function fillTo(list, min) {
  if (list.length === 0) return list
  const out = [...list]
  while (out.length < min) out.push(...list)
  return out
}

async function loadHome() {
  const [trending, comingSoon, events, categories, venues] = await Promise.all([
    listMovies({ status: 'NOW_SHOWING', sort: 'RATING_DESC', size: 6 }),
    listMovies({ status: 'COMING_SOON', sort: 'RELEASE_DATE_ASC', size: 5 }),
    listEvents({ sort: 'DATE_ASC', size: 4 }),
    listEventCategories(),
    listVenues(),
  ])
  return {
    featured: trending.content[0] ?? null,
    trending: trending.content.slice(1),
    comingSoon: comingSoon.content,
    posters: fillTo([...trending.content, ...comingSoon.content].filter((movie) => movie.posterUrl), 14),
    upcomingEvents: events.content,
    categories,
    venues: venues.slice(0, 6),
  }
}

/** Home hero: two endless rows of movie posters drifting in opposite directions. */
function Hero({ posters }) {
  const second = posters ? [...posters.slice(Math.ceil(posters.length / 2)), ...posters.slice(0, Math.ceil(posters.length / 2))] : []
  return (
    <section aria-label="Movies on ShowTime" className="relative isolate overflow-hidden bg-[#141414] py-8 sm:py-10">
      <h1 className="sr-only">ShowTime: book movies and live events</h1>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_15%_0%,rgb(255_90_95/0.3),transparent_60%),radial-gradient(50rem_25rem_at_85%_100%,rgb(252_100_45/0.18),transparent_60%)]"
      />
      {posters === null ? (
        <div aria-hidden="true" className="space-y-4 overflow-hidden px-4">
          {[0, 1].map((row) => (
            <div key={row} className="flex gap-4">
              {Array.from({ length: 10 }, (_, index) => (
                <div key={index} className="aspect-[2/3] w-32 shrink-0 animate-pulse rounded-xl bg-white/10 sm:w-40 lg:w-48" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <PosterRow movies={posters} />
          <PosterRow movies={second} reverse />
        </div>
      )}
    </section>
  )
}

function FeaturedSpotlight({ movie }) {
  return (
    <section aria-labelledby="featured-heading" className="container-page pt-12">
      <div data-reveal className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <PosterArt title={movie.title} palette={paletteFor(movie.slug)} imageUrl={movie.posterUrl} aspect="wide" className="rounded-none md:aspect-auto md:h-full" />
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
          {movie.newRelease && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="promo">New release</Badge>
            </div>
          )}
          <div>
            <h2 id="featured-heading" className="text-3xl font-extrabold tracking-tight text-ink">
              {movie.title}
            </h2>
            <p className="mt-2 max-w-xl text-base text-ink-secondary">{movie.synopsis}</p>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-secondary">
            <li className="inline-flex items-center gap-1.5">
              <Clapperboard aria-hidden="true" size={16} className="text-ink-muted" />
              {movie.genres.map((genre) => genre.name).join(', ')}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" size={16} className="text-ink-muted" />
              {formatDuration(movie.durationMinutes)}
              {movie.certification && ` · ${movie.certification}`}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Languages aria-hidden="true" size={16} className="text-ink-muted" />
              {movie.language}
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button to={`/movies/${movie.slug}`} size="lg">
              Book tickets
            </Button>
            <RatingBadge rating={movie.rating} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** One compact, scrollable row of event categories that currently have events. */
function CategoryChips({ categories }) {
  const withEvents = categories.filter((category) => category.upcomingEvents > 0)
  if (withEvents.length === 0) return null
  return (
    <nav data-reveal aria-label="Event categories" className="-mx-4 mb-6 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {withEvents.map((category) => {
          const Icon = iconForCategory(category.value)
          return (
            <li key={category.value}>
              <Link
                to={`/events?category=${category.value}`}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-medium whitespace-nowrap text-ink transition-colors hover:border-ink hover:bg-surface-subtle"
              >
                <Icon aria-hidden="true" size={15} className="text-primary-strong" />
                {category.label}
                <span className="rounded-full bg-surface-subtle px-1.5 text-xs font-semibold text-ink-muted">{category.upcomingEvents}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default function HomePage() {
  useDocumentTitle(null)
  const { data, isLoading, error, reload } = useAsync(loadHome, [])

  return (
    <>
      <Hero posters={data ? data.posters : error ? [] : null} />
      {isLoading && (
        <div className="container-page space-y-12 py-12">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <CardGridSkeleton count={5} className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5" />
        </div>
      )}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {data && (
        <>
          {data.featured ? (
            <FeaturedSpotlight movie={data.featured} />
          ) : (
            <EmptyState icon={Clapperboard} title="No movies are showing right now" message="Check back soon for new releases." />
          )}

          {data.trending.length > 0 && (
            <section aria-labelledby="trending-heading" className="container-page pt-14">
              <SectionHeader id="trending-heading" title="Trending movies" subtitle="Now showing in cinemas" actionLabel="See all" actionTo="/movies" />
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                {data.trending.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="events-heading" className="container-page pt-14">
            <SectionHeader id="events-heading" title="Upcoming events" subtitle="Concerts, festivals, sports and more" actionLabel="See all" actionTo="/events" />
            <CategoryChips categories={data.categories} />
            {data.upcomingEvents.length === 0 ? (
              <EmptyState icon={CalendarX} title="No upcoming events yet" className="rounded-card border border-line" />
            ) : (
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {data.upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>

          {data.comingSoon.length > 0 && (
            <section aria-labelledby="coming-soon-heading" className="container-page pt-14">
              <SectionHeader id="coming-soon-heading" title="Coming soon" actionLabel="See all" actionTo="/movies?status=COMING_SOON" />
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                {data.comingSoon.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="venues-heading" className="container-page py-14">
            <SectionHeader id="venues-heading" title="Popular venues" subtitle="Cinemas, auditoriums and arenas" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
