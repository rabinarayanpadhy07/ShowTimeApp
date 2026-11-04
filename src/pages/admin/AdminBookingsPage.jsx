import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { getAdminBooking, listAllBookings } from '../../api/adminApi'
import { AdminPage, DataTable, FilterBar, StatusBadge } from '../../components/admin/AdminUi'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/FormControls'
import { Modal } from '../../components/ui/Modal'
import { SearchInput } from '../../components/ui/SearchInput'
import { LoadingState } from '../../components/ui/States'
import { useAdminList } from '../../hooks/useAdminList'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { BOOKING_STATUS_LABEL, BOOKING_TYPE, options, PAYMENT_STATUS, REFUND_REASON, REFUND_STATUS } from '../../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../../lib/format'

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  )
}

function BookingDetail({ reference }) {
  const detail = useAsync(() => getAdminBooking(reference), [reference])
  if (detail.isLoading) return <LoadingState label="Loading booking…" />
  if (detail.error) return <Alert tone="error">{detail.error.message}</Alert>
  const { booking, customer, notifications } = detail.data
  const zone = booking.venue.timeZone
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={booking.status} labels={BOOKING_STATUS_LABEL} />
        {booking.testPayment && <Badge tone="promo">Test payment</Badge>}
      </div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-ink-muted">Customer</dt>
          <dd className="text-ink">
            {customer.fullName} · {customer.email}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Show</dt>
          <dd className="text-ink">
            {booking.title} · {formatDateTime(booking.startsAt, zone)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Venue</dt>
          <dd className="text-ink">
            {booking.venue.name}
            {booking.screenName && ` · ${booking.screenName}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Amount</dt>
          <dd className="text-ink">
            {formatCurrency(booking.total, booking.currency)} ({formatCurrency(booking.subtotal, booking.currency)} +{' '}
            {formatCurrency(booking.fees, booking.currency)} fees)
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Booked</dt>
          <dd className="text-ink">{formatDateTime(booking.createdAt, zone)}</dd>
        </div>
        {booking.cancelledAt && (
          <div>
            <dt className="text-xs text-ink-muted">Cancelled</dt>
            <dd className="text-ink">{formatDateTime(booking.cancelledAt, zone)}</dd>
          </div>
        )}
      </dl>
      <Section title={`Tickets (${booking.tickets.length})`}>
        {booking.tickets.length === 0 ? (
          <p className="text-ink-muted">No tickets: they are issued when the booking is confirmed.</p>
        ) : (
          <ul className="divide-y divide-line rounded-control border border-line">
            {booking.tickets.map((ticket) => (
              <li key={ticket.code} className="flex justify-between gap-3 px-3 py-2">
                <span>
                  <span className="font-mono text-xs">{ticket.code}</span> · {ticket.seatLabel ?? 'General admission'}
                </span>
                <span className="text-xs">
                  {ticket.status}
                  {ticket.checkedInAt && ` · ${formatDateTime(ticket.checkedInAt, zone)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Payments">
        {booking.payments.length === 0 ? (
          <p className="text-ink-muted">No payment attempts.</p>
        ) : (
          <ul className="divide-y divide-line rounded-control border border-line">
            {booking.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap justify-between gap-3 px-3 py-2">
                <span>
                  #{payment.id} · {payment.provider}
                  {payment.testMode && ' (test)'} · {formatDateTime(payment.createdAt, zone)}
                  {payment.failureReason && <span className="block text-xs text-ink-muted">{payment.failureReason}</span>}
                </span>
                <span>
                  {formatCurrency(payment.amount, booking.currency)} ·{' '}
                  <StatusBadge value={payment.status} labels={PAYMENT_STATUS} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {booking.refunds.length > 0 && (
        <Section title="Refunds">
          <ul className="divide-y divide-line rounded-control border border-line">
            {booking.refunds.map((refund) => (
              <li key={refund.createdAt} className="flex flex-wrap justify-between gap-3 px-3 py-2">
                <span>
                  {REFUND_REASON[refund.reason] ?? refund.reason} · {formatDateTime(refund.createdAt, zone)}
                </span>
                <span>
                  {formatCurrency(refund.amount, booking.currency)} · <StatusBadge value={refund.status} labels={REFUND_STATUS} />
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Emails">
        {notifications.length === 0 ? (
          <p className="text-ink-muted">None.</p>
        ) : (
          <ul className="divide-y divide-line rounded-control border border-line">
            {notifications.map((n) => (
              <li key={`${n.type}-${n.createdAt}`} className="flex justify-between gap-3 px-3 py-2 text-xs">
                <span>{n.type.replaceAll('_', ' ').toLowerCase()}</span>
                <span>
                  {n.status}
                  {n.attempts > 1 && ` after ${n.attempts} attempts`}
                  {n.sentAt && ` · ${formatDateTime(n.sentAt, zone)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

export default function AdminBookingsPage() {
  useDocumentTitle('Bookings · Admin')
  const [params] = useSearchParams()
  const initialQuery = params.get('q') ?? ''
  const list = useAdminList(listAllBookings, { q: initialQuery, status: '', type: '', from: '', to: '', sort: 'createdAt,desc' })
  const [open, setOpen] = useState(null)

  const columns = [
    {
      header: 'Reference',
      cell: (b) => (
        <Button variant="link" className="font-mono text-xs" onClick={() => setOpen(b.reference)}>
          {b.reference}
        </Button>
      ),
    },
    {
      header: 'Booking',
      cell: (b) => (
        <span>
          <span className="block font-medium text-ink">{b.title}</span>
          <span className="block text-xs text-ink-muted">
            {b.venueName} · {formatDateTime(b.startsAt)}
          </span>
        </span>
      ),
    },
    { header: 'Customer', cell: (b) => b.customerEmail },
    { header: 'Tickets', cell: (b) => b.tickets, className: 'text-right' },
    {
      header: 'Total',
      cell: (b) => (
        <span className="whitespace-nowrap">
          {formatCurrency(b.total, b.currency)}
          {b.testPayment && <span className="block text-xs text-ink-muted">test</span>}
        </span>
      ),
      className: 'text-right',
    },
    { header: 'Status', cell: (b) => <StatusBadge value={b.status} labels={BOOKING_STATUS_LABEL} /> },
    { header: 'Booked', cell: (b) => formatDateTime(b.createdAt), className: 'whitespace-nowrap text-xs' },
  ]

  return (
    <AdminPage title="Bookings" description="Every booking, searchable by reference or customer email.">
      <FilterBar>
        <SearchInput
          label="Search bookings"
          placeholder="Reference or email"
          defaultValue={initialQuery}
          onSearch={(q) => list.setFilter('q', q)}
        />
        <SelectField
          label="Status"
          value={list.filters.status}
          onChange={(e) => list.setFilter('status', e.target.value)}
          placeholder="All statuses"
          options={options(BOOKING_STATUS_LABEL)}
        />
        <SelectField
          label="Type"
          value={list.filters.type}
          onChange={(e) => list.setFilter('type', e.target.value)}
          placeholder="Movies and events"
          options={options(BOOKING_TYPE)}
        />
        <SelectField
          label="Sort"
          value={list.filters.sort}
          onChange={(e) => list.setFilter('sort', e.target.value)}
          options={[
            { value: 'createdAt,desc', label: 'Newest first' },
            { value: 'createdAt,asc', label: 'Oldest first' },
            { value: 'total,desc', label: 'Highest total' },
          ]}
        />
        <TextField
          label="Booked from"
          type="date"
          value={list.filters.from}
          onChange={(e) => list.setFilter('from', e.target.value)}
        />
        <TextField label="Booked to" type="date" value={list.filters.to} onChange={(e) => list.setFilter('to', e.target.value)} />
      </FilterBar>
      <DataTable label="Bookings" columns={columns} list={list} rowKey={(b) => b.reference} emptyTitle="No bookings match" />
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={`Booking ${open ?? ''}`} size="lg">
        {open && <BookingDetail reference={open} />}
      </Modal>
    </AdminPage>
  )
}
