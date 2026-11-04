import { useState } from 'react'
import { CalendarPlus, Pencil, Plus } from 'lucide-react'

import { createEvent, createEventSchedule, getAdminEvent, listAdminEvents, setEventStatus, updateEvent } from '../../api/adminApi'
import {
  AdminPage,
  ConfirmDialog,
  DataTable,
  FilterBar,
  FormDialog,
  StatusBadge,
  TextAreaField,
} from '../../components/admin/AdminUi'
import { EventDateCreateFields } from '../../components/admin/ScheduleForms'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/FormControls'
import { SearchInput } from '../../components/ui/SearchInput'
import { LoadingState } from '../../components/ui/States'
import { useAdminList } from '../../hooks/useAdminList'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { eventDatePayload } from '../../lib/adminPayloads'
import { field, numberField } from '../../lib/formData'
import { EVENT_CATEGORY, EVENT_STATUS, options } from '../../lib/adminLabels'
import { slugify } from '../../lib/slugify'

function EventFields({ event, errors }) {
  const [slug, setSlug] = useState(event?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(event))
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Title"
          name="title"
          required
          defaultValue={event?.title}
          onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
          error={errors.title}
        />
        <TextField
          label="URL slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          hint="Lowercase words separated by hyphens; used in /events/…"
          error={errors.slug}
        />
      </div>
      <TextAreaField label="Description" name="description" defaultValue={event?.description ?? ''} error={errors.description} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Category"
          name="category"
          required
          defaultValue={event?.category ?? 'CONCERT'}
          options={options(EVENT_CATEGORY)}
          error={errors.category}
        />
        <SelectField
          label="Status"
          name="status"
          required
          defaultValue={event?.status ?? 'DRAFT'}
          options={options(EVENT_STATUS)}
          error={errors.status}
        />
        <TextField
          label="Organizer"
          name="organizerName"
          defaultValue={event?.organizerName ?? ''}
          error={errors.organizerName}
        />
        <TextField label="Language" name="language" defaultValue={event?.language ?? ''} error={errors.language} />
        <TextField
          label="Duration (minutes)"
          name="durationMinutes"
          type="number"
          min="1"
          max="1440"
          defaultValue={event?.durationMinutes ?? ''}
          error={errors.durationMinutes}
        />
        <TextField
          label="Minimum age"
          name="minAge"
          type="number"
          min="0"
          max="21"
          defaultValue={event?.minAge ?? ''}
          error={errors.minAge}
        />
      </div>
      <TextField label="Image URL" name="imageUrl" type="url" defaultValue={event?.imageUrl ?? ''} error={errors.imageUrl} />
    </>
  )
}

const eventPayload = (form) => ({
  title: field(form, 'title'),
  slug: field(form, 'slug'),
  description: field(form, 'description'),
  category: field(form, 'category'),
  organizerName: field(form, 'organizerName'),
  language: field(form, 'language'),
  durationMinutes: numberField(form, 'durationMinutes'),
  minAge: numberField(form, 'minAge'),
  imageUrl: field(form, 'imageUrl'),
  status: field(form, 'status'),
})

function EditEventDialog({ eventId, onClose, onSaved }) {
  const event = useAsync(() => getAdminEvent(eventId), [eventId])
  return (
    <FormDialog
      open
      onClose={onClose}
      title="Edit event"
      onSubmit={async (form) => {
        await updateEvent(eventId, eventPayload(form))
        onSaved()
      }}
    >
      {(errors) =>
        event.data ? (
          <EventFields event={event.data} errors={errors} />
        ) : event.error ? (
          <Alert tone="error">{event.error.message}</Alert>
        ) : (
          <LoadingState label="Loading event…" />
        )
      }
    </FormDialog>
  )
}

export default function AdminEventsPage() {
  useDocumentTitle('Events · Admin')
  const list = useAdminList(listAdminEvents, { q: '', status: '', category: '', sort: 'createdAt,desc' })
  const [dialog, setDialog] = useState(null)
  const close = () => setDialog(null)

  const columns = [
    {
      header: 'Event',
      cell: (event) => (
        <span>
          <span className="block font-semibold text-ink">{event.title}</span>
          <span className="block text-xs text-ink-muted">{event.organizerName ?? '—'}</span>
        </span>
      ),
    },
    { header: 'Category', cell: (event) => EVENT_CATEGORY[event.category] ?? event.category },
    { header: 'Status', cell: (event) => <StatusBadge value={event.status} labels={EVENT_STATUS} /> },
    { header: 'Upcoming dates', cell: (event) => event.upcomingDates, className: 'text-right' },
    {
      header: 'Actions',
      cell: (event) => (
        <span className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" leftIcon={Pencil} onClick={() => setDialog({ type: 'edit', event })}>
            Edit
          </Button>
          {(event.status === 'DRAFT' || event.status === 'PUBLISHED') && (
            <Button size="sm" variant="ghost" leftIcon={CalendarPlus} onClick={() => setDialog({ type: 'date', event })}>
              Add date
            </Button>
          )}
          {event.status === 'DRAFT' && (
            <Button size="sm" variant="ghost" onClick={() => setDialog({ type: 'status', event, status: 'PUBLISHED' })}>
              Publish
            </Button>
          )}
          {event.status === 'PUBLISHED' && (
            <Button size="sm" variant="ghost" onClick={() => setDialog({ type: 'status', event, status: 'DRAFT' })}>
              Unpublish
            </Button>
          )}
        </span>
      ),
    },
  ]

  return (
    <AdminPage
      title="Events"
      description="Concerts, comedy, theatre and more. Only published events with upcoming dates are listed publicly."
      actions={
        <Button leftIcon={Plus} onClick={() => setDialog({ type: 'create' })}>
          New event
        </Button>
      }
    >
      <FilterBar>
        <SearchInput label="Search events" placeholder="Title" onSearch={(q) => list.setFilter('q', q)} />
        <SelectField
          label="Status"
          value={list.filters.status}
          onChange={(e) => list.setFilter('status', e.target.value)}
          placeholder="All statuses"
          options={options(EVENT_STATUS)}
        />
        <SelectField
          label="Category"
          value={list.filters.category}
          onChange={(e) => list.setFilter('category', e.target.value)}
          placeholder="All categories"
          options={options(EVENT_CATEGORY)}
        />
        <SelectField
          label="Sort"
          value={list.filters.sort}
          onChange={(e) => list.setFilter('sort', e.target.value)}
          options={[
            { value: 'createdAt,desc', label: 'Recently added' },
            { value: 'title,asc', label: 'Title A–Z' },
            { value: 'category,asc', label: 'Category' },
          ]}
        />
      </FilterBar>
      <DataTable label="Events" columns={columns} list={list} emptyTitle="No events match" />

      {dialog?.type === 'create' && (
        <FormDialog
          open
          onClose={close}
          title="New event"
          submitLabel="Create event"
          onSubmit={async (form) => {
            await createEvent(eventPayload(form))
            list.reload()
          }}
        >
          {(errors) => <EventFields errors={errors} />}
        </FormDialog>
      )}
      {dialog?.type === 'edit' && <EditEventDialog eventId={dialog.event.id} onClose={close} onSaved={list.reload} />}
      {dialog?.type === 'date' && (
        <FormDialog
          open
          onClose={close}
          title={`Add a date · ${dialog.event.title}`}
          description="Reserved seating uses a hall's seat map; general admission sells a fixed number of tickets."
          submitLabel="Add date"
          onSubmit={async (form) => {
            await createEventSchedule(dialog.event.id, eventDatePayload(form))
            list.reload()
          }}
        >
          {(errors) => <EventDateCreateFields errors={errors} />}
        </FormDialog>
      )}
      {dialog?.type === 'status' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`${dialog.status === 'PUBLISHED' ? 'Publish' : 'Unpublish'} ${dialog.event.title}?`}
          confirmLabel={dialog.status === 'PUBLISHED' ? 'Publish' : 'Unpublish'}
          onConfirm={async () => {
            await setEventStatus(dialog.event.id, dialog.status)
            list.reload()
          }}
        >
          <p>
            {dialog.status === 'PUBLISHED'
              ? 'The event becomes visible to customers once it has upcoming dates.'
              : 'The event will be hidden from customers. An event with upcoming dates cannot be unpublished until they are cancelled.'}
          </p>
        </ConfirmDialog>
      )}
    </AdminPage>
  )
}
