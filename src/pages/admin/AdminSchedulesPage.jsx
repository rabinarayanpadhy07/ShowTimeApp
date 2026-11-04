import { useState } from 'react'
import { Ban, Pencil } from 'lucide-react'

import {
  cancelEventSchedule,
  cancelShow,
  getAdminVenue,
  listEventSchedules,
  listShows,
  updateEventSchedule,
  updateShow,
} from '../../api/adminApi'
import { AdminPage, ConfirmDialog, DataTable, FilterBar, FormDialog, StatusBadge } from '../../components/admin/AdminUi'
import { EventTimingFields, ShowFields } from '../../components/admin/ScheduleForms'
import { Tabs } from '../../components/admin/Tabs'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox, SelectField, TextField } from '../../components/ui/FormControls'
import { LoadingState } from '../../components/ui/States'
import { useAdminList } from '../../hooks/useAdminList'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { eventDatePayload, showPayload } from '../../lib/adminPayloads'
import { useTab } from '../../hooks/useTab'
import { options, SCHEDULE_STATUS, SEATING_TYPE, SHOW_FORMAT } from '../../lib/adminLabels'
import { formatCurrency, formatDateTime, toLocalDateKey } from '../../lib/format'

// Past shows keep the SCHEDULED status, so lists start from today unless the admin picks a date.
const upcomingFilters = () => ({ status: 'SCHEDULED', from: toLocalDateKey(new Date().toISOString()), to: '', sort: 'startsAt,asc' })

const TABS = [
  { id: 'shows', label: 'Movie shows' },
  { id: 'events', label: 'Event dates' },
]

function DateFilters({ list }) {
  return (
    <FilterBar>
      <SelectField
        label="Status"
        value={list.filters.status}
        onChange={(e) => list.setFilter('status', e.target.value)}
        placeholder="All statuses"
        options={options(SCHEDULE_STATUS)}
      />
      <TextField label="From" type="date" value={list.filters.from} onChange={(e) => list.setFilter('from', e.target.value)} />
      <TextField label="To" type="date" value={list.filters.to} onChange={(e) => list.setFilter('to', e.target.value)} />
      <SelectField
        label="Sort"
        value={list.filters.sort}
        onChange={(e) => list.setFilter('sort', e.target.value)}
        options={[
          { value: 'startsAt,asc', label: 'Soonest first' },
          { value: 'startsAt,desc', label: 'Latest first' },
          { value: 'createdAt,desc', label: 'Recently added' },
        ]}
      />
    </FilterBar>
  )
}

/** Cancelling with live bookings must be confirmed explicitly; they are then cancelled and fully refunded. */
function CancelScheduleDialog({ item, title, onCancel, onClose, onDone }) {
  const [refund, setRefund] = useState(false)
  const needsConfirmation = item.activeBookings > 0
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={`Cancel ${title}?`}
      tone="danger"
      confirmLabel="Cancel it"
      onConfirm={async () => {
        if (needsConfirmation && !refund) throw new Error('Tick the box to cancel the bookings and refund customers.')
        onDone(await onCancel(item.id, needsConfirmation))
      }}
    >
      <p>
        {formatDateTime(item.startsAt)} at {item.venueName}. This cannot be undone.
      </p>
      {needsConfirmation ? (
        <Checkbox
          label={`Cancel ${item.activeBookings} active booking(s) and refund customers in full`}
          description="Customers are emailed and their tickets stop working."
          checked={refund}
          onChange={(e) => setRefund(e.target.checked)}
        />
      ) : (
        <p>There are no active bookings.</p>
      )}
    </ConfirmDialog>
  )
}

function ShowsTab() {
  const list = useAdminList(listShows, upcomingFilters())
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState(null)
  const close = () => setDialog(null)

  const columns = [
    {
      header: 'Show',
      cell: (show) => (
        <span>
          <span className="block font-semibold text-ink">{show.movieTitle}</span>
          <span className="block text-xs text-ink-muted">
            {SHOW_FORMAT[show.format]} · {show.language}
          </span>
        </span>
      ),
    },
    { header: 'When', cell: (show) => formatDateTime(show.startsAt), className: 'whitespace-nowrap' },
    { header: 'Where', cell: (show) => `${show.venueName} · ${show.screenName}` },
    { header: 'Sold', cell: (show) => `${show.seatsSold} / ${show.seatsTotal}`, className: 'text-right whitespace-nowrap' },
    { header: 'Price', cell: (show) => formatCurrency(show.basePrice), className: 'text-right' },
    { header: 'Status', cell: (show) => <StatusBadge value={show.status} labels={SCHEDULE_STATUS} /> },
    {
      header: 'Actions',
      cell: (show) =>
        show.status === 'SCHEDULED' && (
          <span className="flex gap-1">
            <Button size="sm" variant="ghost" leftIcon={Pencil} onClick={() => setDialog({ type: 'edit', show })}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" leftIcon={Ban} onClick={() => setDialog({ type: 'cancel', show })}>
              Cancel
            </Button>
          </span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <DateFilters list={list} />
      {notice && <Alert tone="success">{notice}</Alert>}
      <DataTable label="Movie shows" columns={columns} list={list} emptyTitle="No shows match" />
      {dialog?.type === 'edit' && (
        <FormDialog
          open
          onClose={close}
          title={`Edit show · ${dialog.show.movieTitle}`}
          description="Time and screen are fixed once seats are booked; prices can still change for new bookings."
          onSubmit={async (form) => {
            await updateShow(dialog.show.id, showPayload(form))
            list.reload()
          }}
        >
          {(errors) => <ShowFields show={dialog.show} errors={errors} />}
        </FormDialog>
      )}
      {dialog?.type === 'cancel' && (
        <CancelScheduleDialog
          item={dialog.show}
          title={`${dialog.show.movieTitle}`}
          onCancel={cancelShow}
          onClose={close}
          onDone={(result) => {
            setNotice(
              `Show cancelled. ${result.bookingsCancelled} booking(s) cancelled, ${result.refundsRequested} refund(s) requested.`,
            )
            list.reload()
          }}
        />
      )}
    </div>
  )
}

function EditEventDateDialog({ schedule, onClose, onSaved }) {
  const venue = useAsync(() => getAdminVenue(schedule.venueId), [schedule.venueId])
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Edit date · ${schedule.eventTitle}`}
      description="The time is fixed once tickets are sold; capacity cannot go below tickets sold."
      onSubmit={async (form) => {
        const { startsAt, endsAt, doorsOpenAt, capacity, basePrice, premiumPrice } = eventDatePayload(form, venue.data.timeZone)
        await updateEventSchedule(schedule.id, { startsAt, endsAt, doorsOpenAt, capacity, basePrice, premiumPrice })
        onSaved()
      }}
    >
      {(errors) =>
        venue.data ? (
          <EventTimingFields
            schedule={schedule}
            errors={errors}
            timeZone={venue.data.timeZone}
            showCapacity={schedule.seatingType === 'GENERAL_ADMISSION'}
          />
        ) : venue.error ? (
          <Alert tone="error">{venue.error.message}</Alert>
        ) : (
          <LoadingState label="Loading…" />
        )
      }
    </FormDialog>
  )
}

function EventDatesTab() {
  const list = useAdminList(listEventSchedules, upcomingFilters())
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState(null)
  const close = () => setDialog(null)

  const columns = [
    {
      header: 'Event',
      cell: (s) => (
        <span>
          <span className="block font-semibold text-ink">{s.eventTitle}</span>
          <span className="block text-xs text-ink-muted">{SEATING_TYPE[s.seatingType]}</span>
        </span>
      ),
    },
    { header: 'When', cell: (s) => formatDateTime(s.startsAt), className: 'whitespace-nowrap' },
    { header: 'Where', cell: (s) => (s.screenName ? `${s.venueName} · ${s.screenName}` : s.venueName) },
    {
      header: 'Sold',
      cell: (s) => (s.capacity ? `${s.ticketsSold} / ${s.capacity}` : s.ticketsSold),
      className: 'text-right whitespace-nowrap',
    },
    { header: 'Price', cell: (s) => formatCurrency(s.basePrice), className: 'text-right' },
    { header: 'Status', cell: (s) => <StatusBadge value={s.status} labels={SCHEDULE_STATUS} /> },
    {
      header: 'Actions',
      cell: (s) =>
        s.status === 'SCHEDULED' && (
          <span className="flex gap-1">
            <Button size="sm" variant="ghost" leftIcon={Pencil} onClick={() => setDialog({ type: 'edit', schedule: s })}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" leftIcon={Ban} onClick={() => setDialog({ type: 'cancel', schedule: s })}>
              Cancel
            </Button>
          </span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <DateFilters list={list} />
      {notice && <Alert tone="success">{notice}</Alert>}
      <DataTable label="Event dates" columns={columns} list={list} emptyTitle="No event dates match" />
      {dialog?.type === 'edit' && <EditEventDateDialog schedule={dialog.schedule} onClose={close} onSaved={list.reload} />}
      {dialog?.type === 'cancel' && (
        <CancelScheduleDialog
          item={dialog.schedule}
          title={dialog.schedule.eventTitle}
          onCancel={cancelEventSchedule}
          onClose={close}
          onDone={(result) => {
            setNotice(
              `Date cancelled. ${result.bookingsCancelled} booking(s) cancelled, ${result.refundsRequested} refund(s) requested.`,
            )
            list.reload()
          }}
        />
      )}
    </div>
  )
}

export default function AdminSchedulesPage() {
  useDocumentTitle('Schedules · Admin')
  const [tab, setTab] = useTab(TABS)
  return (
    <AdminPage title="Schedules" description="Every movie show and event date. Add new ones from the Movies and Events pages.">
      <Tabs label="Schedule type" tabs={TABS} current={tab} onSelect={setTab} />
      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'shows' ? <ShowsTab /> : <EventDatesTab />}
      </div>
    </AdminPage>
  )
}
