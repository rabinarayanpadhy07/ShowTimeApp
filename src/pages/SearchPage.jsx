import { Search } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import { search } from '../api/catalogApi'
import { EventCard } from '../components/catalog/EventCard'
import { MovieCard } from '../components/catalog/MovieCard'
import { VenueCard } from '../components/catalog/VenueCard'
import { SearchInput } from '../components/ui/SearchInput'
import { PageHeader, SectionHeader } from '../components/ui/Section'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function SearchPage() {
  useDocumentTitle('Search')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = params.get('q')?.trim() ?? ''
  const { data, isLoading, error, reload } = useAsync(
    () => (query ? search(query) : Promise.resolve({ movies: [], events: [], venues: [] })),
    [query],
  )
  const total = data ? data.movies.length + data.events.length + data.venues.length : 0

  return (
    <>
      <PageHeader title={query ? `Results for “${query}”` : 'Search'} subtitle="Movies, events and venues in one place.">
        <SearchInput
          key={query}
          defaultValue={query}
          label="Search movies, events or venues"
          className="max-w-xl"
          onSearch={(term) => navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search')}
        />
      </PageHeader>
      <div className="container-page space-y-12 py-10">
        {!query && <EmptyState icon={Search} title="What are you looking for?" message="Search by movie or event title, venue or city." />}
        {query && isLoading && <CardGridSkeleton count={4} className="grid grid-cols-2 gap-5 sm:grid-cols-4" />}
        {query && error && <ErrorState message={error.message} onRetry={reload} />}
        {query && data && total === 0 && (
          <EmptyState icon={Search} title="No results" message={`Nothing matched “${query}”. Check the spelling or try a broader term.`} />
        )}
        {data && data.movies.length > 0 && (
          <section aria-labelledby="movie-results">
            <SectionHeader id="movie-results" title={`Movies (${data.movies.length})`} />
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {data.movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}
        {data && data.events.length > 0 && (
          <section aria-labelledby="event-results">
            <SectionHeader id="event-results" title={`Events (${data.events.length})`} />
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {data.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
        {data && data.venues.length > 0 && (
          <section aria-labelledby="venue-results">
            <SectionHeader id="venue-results" title={`Venues (${data.venues.length})`} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
