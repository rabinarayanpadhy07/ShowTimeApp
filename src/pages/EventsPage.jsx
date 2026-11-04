import { CalendarX } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { listCities, listEventCategories, listEvents } from '../api/catalogApi'
import { EventCard } from '../components/catalog/EventCard'
import { iconForCategory } from '../components/catalog/categoryIcons'
import { Button } from '../components/ui/Button'
import { FilterChips } from '../components/ui/FilterChips'
import { SelectField, TextField } from '../components/ui/FormControls'
import { Pagination } from '../components/ui/Pagination'
import { SearchInput } from '../components/ui/SearchInput'
import { PageHeader } from '../components/ui/Section'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { pluralize } from '../lib/format'
import { EVENT_SORTS } from '../lib/labels'

const PAGE_SIZE = 12
const GRID = 'grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4'
const PRICE_BANDS = [
  { value: '0-500', label: 'Under ₹500' },
  { value: '500-1000', label: '₹500 – ₹1,000' },
  { value: '1000-', label: '₹1,000 & above' },
]

export default function EventsPage() {
  useDocumentTitle('Events')
  const [params, setParams] = useSearchParams()
  const filters = {
    category: params.get('category') ?? '',
    city: params.get('city') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    price: params.get('price') ?? '',
    sort: params.get('sort') ?? 'DATE_ASC',
    q: params.get('q') ?? '',
    page: Math.max(1, Number(params.get('page')) || 1),
  }
  const [minPrice, maxPrice] = filters.price ? filters.price.split('-') : ['', '']

  const categories = useAsync(listEventCategories, [])
  const cities = useAsync(listCities, [])
  const events = useAsync(
    () =>
      listEvents({
        q: filters.q,
        category: filters.category,
        city: filters.city,
        from: filters.from,
        to: filters.to,
        minPrice,
        maxPrice,
        sort: filters.sort,
        page: filters.page - 1,
        size: PAGE_SIZE,
      }),
    [filters.category, filters.city, filters.from, filters.to, filters.price, filters.sort, filters.q, filters.page],
  )

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  return (
    <>
      <PageHeader title="Live events" subtitle="Concerts, comedy, theatre, sport and workshops happening near you.">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))] lg:items-end">
            <SearchInput
              key={filters.q}
              defaultValue={filters.q}
              label="Search events"
              placeholder="Search events"
              className="sm:col-span-2 lg:col-span-1"
              onSearch={(term) => update({ q: term })}
            />
            <SelectField
              label="City"
              value={filters.city}
              placeholder="All cities"
              options={(cities.data ?? []).map((city) => ({ value: city, label: city }))}
              onChange={(event) => update({ city: event.target.value })}
            />
            <TextField label="From" type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => update({ from: event.target.value })} />
            <TextField label="To" type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => update({ to: event.target.value })} />
            <SelectField
              label="Price"
              value={filters.price}
              placeholder="Any price"
              options={PRICE_BANDS}
              onChange={(event) => update({ price: event.target.value })}
            />
            <SelectField
              label="Sort by"
              value={filters.sort}
              options={EVENT_SORTS}
              onChange={(event) => update({ sort: event.target.value === 'DATE_ASC' ? '' : event.target.value })}
            />
          </div>
          <FilterChips
            label="Category"
            allLabel="All events"
            value={filters.category}
            options={(categories.data ?? []).map((category) => ({
              value: category.value,
              label: category.label,
              icon: iconForCategory(category.value),
            }))}
            onChange={(category) => update({ category })}
          />
        </div>
      </PageHeader>

      <div className="container-page py-10">
        {events.isLoading && <CardGridSkeleton count={8} variant="event" className={GRID} />}
        {events.error && <ErrorState message={events.error.message} onRetry={events.reload} />}
        {events.data && events.data.content.length === 0 && (
          <EmptyState
            icon={CalendarX}
            title="No events found"
            message="There are no upcoming events that match these filters."
            action={
              <Button variant="outline" onClick={() => setParams({})}>
                Clear filters
              </Button>
            }
          />
        )}
        {events.data && events.data.content.length > 0 && (
          <>
            <p className="mb-6 text-sm text-ink-muted" aria-live="polite">
              {pluralize(events.data.totalElements, 'event')}
            </p>
            <div className={GRID}>
              {events.data.content.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <Pagination
              className="mt-12"
              page={events.data.page + 1}
              totalPages={events.data.totalPages}
              onPageChange={(page) => update({ page: page > 1 ? String(page) : '' })}
            />
          </>
        )}
      </div>
    </>
  )
}
