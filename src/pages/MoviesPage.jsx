import { Clapperboard } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { listGenres, listMovieLanguages, listMovies } from '../api/catalogApi'
import { MovieCard } from '../components/catalog/MovieCard'
import { Button } from '../components/ui/Button'
import { FilterChips } from '../components/ui/FilterChips'
import { SelectField } from '../components/ui/FormControls'
import { Pagination } from '../components/ui/Pagination'
import { SearchInput } from '../components/ui/SearchInput'
import { PageHeader } from '../components/ui/Section'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { pluralize } from '../lib/format'
import { MOVIE_SORTS } from '../lib/labels'

const PAGE_SIZE = 12
const GRID = 'grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4'
const RATING_OPTIONS = [
  { value: '4.5', label: '4.5★ & up' },
  { value: '4', label: '4★ & up' },
  { value: '3', label: '3★ & up' },
]

export default function MoviesPage() {
  useDocumentTitle('Movies')
  const [params, setParams] = useSearchParams()
  const filters = {
    status: params.get('status') === 'COMING_SOON' ? 'COMING_SOON' : 'NOW_SHOWING',
    genre: params.get('genre') ?? '',
    language: params.get('language') ?? '',
    minRating: params.get('minRating') ?? '',
    sort: params.get('sort') ?? 'RELEASE_DATE_DESC',
    q: params.get('q') ?? '',
    page: Math.max(1, Number(params.get('page')) || 1),
  }

  const genres = useAsync(listGenres, [])
  const languages = useAsync(listMovieLanguages, [])
  const movies = useAsync(
    () => listMovies({ ...filters, page: filters.page - 1, size: PAGE_SIZE }),
    [filters.status, filters.genre, filters.language, filters.minRating, filters.sort, filters.q, filters.page],
  )

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  const hasFilters = filters.genre || filters.language || filters.q || filters.minRating

  return (
    <>
      <PageHeader title="Movies" subtitle="Find a film and pick the showtime that suits you.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div role="group" aria-label="Release status" className="inline-flex w-fit rounded-full border border-line p-1">
              {[
                { value: 'NOW_SHOWING', label: 'Now showing' },
                { value: 'COMING_SOON', label: 'Coming soon' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={filters.status === tab.value}
                  onClick={() => update({ status: tab.value === 'NOW_SHOWING' ? '' : tab.value })}
                  className={
                    filters.status === tab.value
                      ? 'h-9 rounded-full bg-ink px-4 text-sm font-semibold text-white'
                      : 'h-9 rounded-full px-4 text-sm font-medium text-ink-secondary hover:text-ink'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <SearchInput
              key={filters.q}
              defaultValue={filters.q}
              label="Search movies"
              placeholder="Search by title"
              className="w-full lg:ml-auto lg:max-w-xs"
              onSearch={(term) => update({ q: term })}
            />
            <div className="grid grid-cols-3 gap-3 lg:flex">
              <SelectField
                label="Language"
                className="lg:w-40"
                value={filters.language}
                placeholder="All languages"
                options={(languages.data ?? []).map((language) => ({ value: language, label: language }))}
                onChange={(event) => update({ language: event.target.value })}
              />
              <SelectField
                label="Rating"
                className="lg:w-36"
                value={filters.minRating}
                placeholder="Any rating"
                options={RATING_OPTIONS}
                onChange={(event) => update({ minRating: event.target.value })}
              />
              <SelectField
                label="Sort by"
                className="lg:w-44"
                value={filters.sort}
                options={MOVIE_SORTS}
                onChange={(event) => update({ sort: event.target.value === 'RELEASE_DATE_DESC' ? '' : event.target.value })}
              />
            </div>
          </div>
          <FilterChips
            label="Genre"
            allLabel="All genres"
            value={filters.genre}
            options={(genres.data ?? []).map((genre) => ({ value: genre.slug, label: genre.name }))}
            onChange={(genre) => update({ genre })}
          />
        </div>
      </PageHeader>

      <div className="container-page py-10">
        {movies.isLoading && <CardGridSkeleton count={8} className={GRID} />}
        {movies.error && <ErrorState message={movies.error.message} onRetry={movies.reload} />}
        {movies.data && movies.data.content.length === 0 && (
          <EmptyState
            icon={Clapperboard}
            title="No movies match your filters"
            message="Try another genre, language or rating, or clear the filters to see everything that's playing."
            action={
              hasFilters && (
                <Button variant="outline" onClick={() => setParams(filters.status === 'COMING_SOON' ? { status: 'COMING_SOON' } : {})}>
                  Clear filters
                </Button>
              )
            }
          />
        )}
        {movies.data && movies.data.content.length > 0 && (
          <>
            <p className="mb-6 text-sm text-ink-muted" aria-live="polite">
              {pluralize(movies.data.totalElements, 'movie')}
            </p>
            <div className={GRID}>
              {movies.data.content.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
            <Pagination
              className="mt-12"
              page={movies.data.page + 1}
              totalPages={movies.data.totalPages}
              onPageChange={(page) => update({ page: page > 1 ? String(page) : '' })}
            />
          </>
        )}
      </div>
    </>
  )
}
