import { useState } from 'react'
import { CalendarPlus, Pencil, Plus } from 'lucide-react'

import { createMovie, createShow, getAdminMovie, listAdminMovies, setMovieStatus, updateMovie } from '../../api/adminApi'
import { listGenres } from '../../api/catalogApi'
import {
  AdminPage,
  ConfirmDialog,
  DataTable,
  FilterBar,
  FormDialog,
  StatusBadge,
  TextAreaField,
} from '../../components/admin/AdminUi'
import { ShowFields } from '../../components/admin/ScheduleForms'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox, SelectField, TextField } from '../../components/ui/FormControls'
import { SearchInput } from '../../components/ui/SearchInput'
import { LoadingState } from '../../components/ui/States'
import { useAdminList } from '../../hooks/useAdminList'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { showPayload } from '../../lib/adminPayloads'
import { field, numberField } from '../../lib/formData'
import { MOVIE_STATUS, options } from '../../lib/adminLabels'
import { formatDuration, formatReleaseDate } from '../../lib/format'
import { slugify } from '../../lib/slugify'

function MovieFields({ movie, errors }) {
  const genres = useAsync(listGenres, [])
  const [slug, setSlug] = useState(movie?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(movie))
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Title"
          name="title"
          required
          defaultValue={movie?.title}
          onChange={(event) => !slugTouched && setSlug(slugify(event.target.value))}
          error={errors.title}
        />
        <TextField
          label="URL slug"
          name="slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true)
            setSlug(event.target.value)
          }}
          hint="Lowercase words separated by hyphens; used in /movies/…"
          error={errors.slug}
        />
      </div>
      <TextAreaField label="Synopsis" name="synopsis" defaultValue={movie?.synopsis ?? ''} error={errors.synopsis} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Duration (minutes)"
          name="durationMinutes"
          type="number"
          min="1"
          max="600"
          required
          defaultValue={movie?.durationMinutes}
          error={errors.durationMinutes}
        />
        <TextField
          label="Release date"
          name="releaseDate"
          type="date"
          defaultValue={movie?.releaseDate ?? ''}
          error={errors.releaseDate}
        />
        <SelectField
          label="Status"
          name="status"
          required
          defaultValue={movie?.status ?? 'COMING_SOON'}
          options={options(MOVIE_STATUS)}
          error={errors.status}
        />
        <TextField label="Language" name="language" required defaultValue={movie?.language} error={errors.language} />
        <TextField
          label="Certification"
          name="certification"
          defaultValue={movie?.certification ?? ''}
          hint="e.g. U, UA, A"
          error={errors.certification}
        />
        <TextField label="Director" name="director" defaultValue={movie?.director ?? ''} error={errors.director} />
      </div>
      <TextField
        label="Cast"
        name="castMembers"
        defaultValue={movie?.castMembers ?? ''}
        hint="Comma-separated"
        error={errors.castMembers}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Poster URL"
          name="posterUrl"
          type="url"
          defaultValue={movie?.posterUrl ?? ''}
          error={errors.posterUrl}
        />
        <TextField
          label="Backdrop URL"
          name="backdropUrl"
          type="url"
          defaultValue={movie?.backdropUrl ?? ''}
          error={errors.backdropUrl}
        />
        <TextField
          label="Trailer URL"
          name="trailerUrl"
          type="url"
          defaultValue={movie?.trailerUrl ?? ''}
          error={errors.trailerUrl}
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Genres</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(genres.data ?? []).map((genre) => (
            <Checkbox
              key={genre.slug}
              name="genreSlugs"
              value={genre.slug}
              label={genre.name}
              defaultChecked={movie?.genreSlugs?.includes(genre.slug)}
            />
          ))}
        </div>
        {errors.genreSlugs && <p className="mt-1 text-xs font-medium text-danger">{errors.genreSlugs}</p>}
      </fieldset>
    </>
  )
}

const moviePayload = (form) => ({
  title: field(form, 'title'),
  slug: field(form, 'slug'),
  synopsis: field(form, 'synopsis'),
  durationMinutes: numberField(form, 'durationMinutes'),
  releaseDate: field(form, 'releaseDate'),
  language: field(form, 'language'),
  certification: field(form, 'certification'),
  director: field(form, 'director'),
  castMembers: field(form, 'castMembers'),
  posterUrl: field(form, 'posterUrl'),
  backdropUrl: field(form, 'backdropUrl'),
  trailerUrl: field(form, 'trailerUrl'),
  status: field(form, 'status'),
  genreSlugs: form.getAll('genreSlugs'),
})

/** Loads the full movie before showing the edit form. */
function EditMovieDialog({ movieId, onClose, onSaved }) {
  const movie = useAsync(() => getAdminMovie(movieId), [movieId])
  return (
    <FormDialog
      open
      onClose={onClose}
      title="Edit movie"
      onSubmit={async (form) => {
        await updateMovie(movieId, moviePayload(form))
        onSaved()
      }}
    >
      {(errors) =>
        movie.data ? (
          <MovieFields movie={movie.data} errors={errors} />
        ) : movie.error ? (
          <Alert tone="error">{movie.error.message}</Alert>
        ) : (
          <LoadingState label="Loading movie…" />
        )
      }
    </FormDialog>
  )
}

export default function AdminMoviesPage() {
  useDocumentTitle('Movies · Admin')
  const list = useAdminList(listAdminMovies, { q: '', status: '', sort: 'createdAt,desc' })
  const [dialog, setDialog] = useState(null)
  const close = () => setDialog(null)

  const columns = [
    {
      header: 'Movie',
      cell: (movie) => (
        <span className="flex items-center gap-3">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt="" className="h-14 w-10 shrink-0 rounded object-cover" />
          ) : (
            <span aria-hidden="true" className="h-14 w-10 shrink-0 rounded bg-surface-subtle" />
          )}
          <span>
            <span className="block font-semibold text-ink">{movie.title}</span>
            <span className="block text-xs text-ink-muted">
              {movie.language} · {formatDuration(movie.durationMinutes)}
            </span>
          </span>
        </span>
      ),
    },
    { header: 'Status', cell: (movie) => <StatusBadge value={movie.status} labels={MOVIE_STATUS} /> },
    {
      header: 'Release',
      cell: (movie) => (movie.releaseDate ? formatReleaseDate(movie.releaseDate) : '—'),
      className: 'whitespace-nowrap',
    },
    { header: 'Upcoming shows', cell: (movie) => movie.upcomingShows, className: 'text-right' },
    {
      header: 'Actions',
      cell: (movie) => (
        <span className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" leftIcon={Pencil} onClick={() => setDialog({ type: 'edit', movie })}>
            Edit
          </Button>
          {movie.status !== 'ARCHIVED' && (
            <Button size="sm" variant="ghost" leftIcon={CalendarPlus} onClick={() => setDialog({ type: 'show', movie })}>
              Add show
            </Button>
          )}
          {movie.status === 'COMING_SOON' && (
            <Button size="sm" variant="ghost" onClick={() => setDialog({ type: 'status', movie, status: 'NOW_SHOWING' })}>
              Publish
            </Button>
          )}
          {movie.status !== 'ARCHIVED' ? (
            <Button size="sm" variant="ghost" onClick={() => setDialog({ type: 'status', movie, status: 'ARCHIVED' })}>
              Archive
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setDialog({ type: 'status', movie, status: 'COMING_SOON' })}>
              Restore
            </Button>
          )}
        </span>
      ),
    },
  ]

  return (
    <AdminPage
      title="Movies"
      description="Catalog entries. A movie is bookable once it has scheduled shows."
      actions={
        <Button leftIcon={Plus} onClick={() => setDialog({ type: 'create' })}>
          New movie
        </Button>
      }
    >
      <FilterBar>
        <SearchInput
          label="Search movies"
          placeholder="Title"
          onSearch={(q) => list.setFilter('q', q)}
          className="sm:col-span-2"
        />
        <SelectField
          label="Status"
          value={list.filters.status}
          onChange={(e) => list.setFilter('status', e.target.value)}
          placeholder="All statuses"
          options={options(MOVIE_STATUS)}
        />
        <SelectField
          label="Sort"
          value={list.filters.sort}
          onChange={(e) => list.setFilter('sort', e.target.value)}
          options={[
            { value: 'createdAt,desc', label: 'Recently added' },
            { value: 'title,asc', label: 'Title A–Z' },
            { value: 'releaseDate,desc', label: 'Release date' },
            { value: 'rating,desc', label: 'Rating' },
          ]}
        />
      </FilterBar>
      <DataTable label="Movies" columns={columns} list={list} emptyTitle="No movies match" />

      {dialog?.type === 'create' && (
        <FormDialog
          open
          onClose={close}
          title="New movie"
          submitLabel="Create movie"
          onSubmit={async (form) => {
            await createMovie(moviePayload(form))
            list.reload()
          }}
        >
          {(errors) => <MovieFields errors={errors} />}
        </FormDialog>
      )}
      {dialog?.type === 'edit' && <EditMovieDialog movieId={dialog.movie.id} onClose={close} onSaved={list.reload} />}
      {dialog?.type === 'show' && (
        <FormDialog
          open
          onClose={close}
          title={`Add a show · ${dialog.movie.title}`}
          description="The screen must be free for the movie's running time."
          submitLabel="Schedule show"
          onSubmit={async (form) => {
            await createShow(dialog.movie.id, showPayload(form))
            list.reload()
          }}
        >
          {(errors) => <ShowFields defaultLanguage={dialog.movie.language} errors={errors} />}
        </FormDialog>
      )}
      {dialog?.type === 'status' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`${dialog.status === 'ARCHIVED' ? 'Archive' : 'Change status of'} ${dialog.movie.title}?`}
          confirmLabel={`Set to ${MOVIE_STATUS[dialog.status]}`}
          onConfirm={async () => {
            await setMovieStatus(dialog.movie.id, dialog.status)
            list.reload()
          }}
        >
          <p>
            {dialog.status === 'ARCHIVED'
              ? 'Archived movies disappear from the public catalog. A movie with upcoming shows cannot be archived until they are cancelled.'
              : `The movie will be listed as “${MOVIE_STATUS[dialog.status]}”.`}
          </p>
        </ConfirmDialog>
      )}
    </AdminPage>
  )
}
