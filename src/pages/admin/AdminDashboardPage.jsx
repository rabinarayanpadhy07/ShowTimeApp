import { useState } from 'react'
import {
  Activity,
  Building2,
  CalendarDays,
  CalendarRange,
  Clapperboard,
  Database,
  IndianRupee,
  MonitorPlay,
  RefreshCw,
  Server,
  Ticket,
  Undo2,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'

import { getMetrics, getOverview } from '../../api/adminApi'
import { AdminPage, StatusBadge } from '../../components/admin/AdminUi'
import { DailyRevenueChart } from '../../components/admin/DailyRevenueChart'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/FormControls'
import { Card } from '../../components/ui/Section'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { env } from '../../config/env'
import { useAsync } from '../../hooks/useAsync'
import { HEALTH_DOT_CLASSES, HEALTH_LABELS, useBackendHealth } from '../../hooks/useBackendHealth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS, REFUND_STATUS } from '../../lib/adminLabels'
import { cn } from '../../lib/cn'
import { formatCurrency, formatDateTime, formatReleaseDate } from '../../lib/format'
import { BOOKING_STATUS } from '../../lib/labels'

function SystemStatusCard() {
  const { status, health, error, checkedAt, recheck } = useBackendHealth()
  const databaseUp = health?.database?.status === 'UP'
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Activity aria-hidden="true" size={18} />
            System status
          </h2>
          <p className="mt-1 text-xs text-ink-muted">Live from GET {env.apiBaseUrl}/health</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={recheck} loading={status === 'checking'}>
          Recheck
        </Button>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-control bg-surface-subtle p-4">
          <dt className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            <Server aria-hidden="true" size={14} /> API
          </dt>
          <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink" role="status" aria-live="polite">
            <span
              aria-hidden="true"
              className={cn('inline-block size-2.5 rounded-full', HEALTH_DOT_CLASSES[status === 'degraded' ? 'up' : status])}
            />
            {status === 'offline' ? 'Unreachable' : status === 'checking' ? 'Checking…' : 'Online'}
          </dd>
        </div>
        <div className="rounded-control bg-surface-subtle p-4">
          <dt className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            <Database aria-hidden="true" size={14} /> MySQL database
          </dt>
          <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <span
              aria-hidden="true"
              className={cn(
                'inline-block size-2.5 rounded-full',
                databaseUp ? HEALTH_DOT_CLASSES.up : health ? HEALTH_DOT_CLASSES.offline : HEALTH_DOT_CLASSES.checking,
              )}
            />
            {databaseUp ? `Connected · ${health.database.latencyMs} ms` : health ? 'Unavailable' : 'Unknown'}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-ink-muted">
        {HEALTH_LABELS[status]}
        {checkedAt && ` · checked ${checkedAt.toLocaleTimeString()}`}
        {error && ` · ${error.message}`}
      </p>
    </Card>
  )
}

function StatTile({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Icon aria-hidden="true" size={16} />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-ink-muted">{note}</p>}
    </div>
  )
}

function LiveCounts() {
  const overview = useAsync(getOverview, [])
  if (overview.isLoading) return <Skeleton className="h-40 w-full rounded-card" />
  if (overview.error) return <ErrorState message={overview.error.message} onRetry={overview.reload} />
  const data = overview.data
  return (
    <section aria-labelledby="overview-heading" className="space-y-4">
      <h2 id="overview-heading" className="text-lg font-bold text-ink">
        Right now
      </h2>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          icon={Clapperboard}
          label="Movies now showing"
          value={data.moviesNowShowing}
          note={`${data.moviesComingSoon} coming soon`}
        />
        <StatTile icon={MonitorPlay} label="Shows · next 7 days" value={data.showsNext7Days} />
        <StatTile icon={CalendarRange} label="Upcoming event dates" value={data.upcomingEventSchedules} />
        <StatTile icon={Building2} label="Venues / screens" value={`${data.venues} / ${data.screens}`} />
        <StatTile icon={Users} label="Registered users" value={data.users} />
        <StatTile
          icon={IndianRupee}
          label="Confirmed revenue (all time)"
          value={formatCurrency(data.confirmedRevenue, data.currency)}
        />
        <StatTile icon={Activity} label="Awaiting payment" value={data.bookingsByStatus.PENDING} />
        <StatTile icon={CalendarDays} label="Confirmed bookings" value={data.bookingsByStatus.CONFIRMED} />
      </div>
    </section>
  )
}

function Metrics() {
  const [range, setRange] = useState({ from: '', to: '' })
  const metrics = useAsync(() => getMetrics(range), [range.from, range.to])
  const data = metrics.data

  const apply = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setRange({ from: form.get('from'), to: form.get('to') })
  }

  return (
    <section aria-labelledby="metrics-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="metrics-heading" className="text-lg font-bold text-ink">
            Sales
          </h2>
          {data && (
            <p className="text-sm text-ink-muted">
              {formatReleaseDate(data.from)} – {formatReleaseDate(data.to)} (by booking date)
            </p>
          )}
        </div>
        <form onSubmit={apply} className="flex flex-wrap items-end gap-2" key={data ? `${data.from}-${data.to}` : 'empty'}>
          <TextField label="From" type="date" name="from" defaultValue={data?.from ?? ''} className="w-40" />
          <TextField label="To" type="date" name="to" defaultValue={data?.to ?? ''} className="w-40" />
          <Button type="submit" variant="outline">
            Apply
          </Button>
        </form>
      </div>
      {metrics.isLoading && !data && <Skeleton className="h-64 w-full rounded-card" />}
      {metrics.error && <Alert tone="error">{metrics.error.message}</Alert>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatTile
              icon={IndianRupee}
              label="Net revenue"
              value={formatCurrency(data.netRevenue, data.currency)}
              note={`Gross ${formatCurrency(data.grossRevenue, data.currency)}`}
            />
            <StatTile
              icon={Undo2}
              label="Refunded"
              value={formatCurrency(data.refundedAmount, data.currency)}
              note={`${formatCurrency(data.pendingRefundAmount, data.currency)} pending`}
            />
            <StatTile icon={Ticket} label="Tickets sold" value={data.ticketsSold} note={`${data.totalBookings} bookings`} />
            <StatTile icon={Activity} label="Average order" value={formatCurrency(data.averageOrderValue, data.currency)} />
          </div>
          {Number(data.testModeRevenue) > 0 && (
            <Alert tone="info" title="Test payments are not counted">
              {formatCurrency(data.testModeRevenue, data.currency)} was paid with Razorpay test keys in this period.
              No real money moved, so it is left out of revenue, refunds and the chart.
            </Alert>
          )}
          <Card>
            <h3 className="mb-4 text-base font-semibold text-ink">Revenue per day</h3>
            <DailyRevenueChart daily={data.daily} currency={data.currency} />
          </Card>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <h3 className="text-sm font-semibold text-ink">Bookings by status</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {Object.entries(data.bookingsByStatus).map(([status, count]) => (
                  <li key={status}>
                    <Badge tone={BOOKING_STATUS[status]?.tone}>
                      {BOOKING_STATUS[status]?.label ?? status}: {count}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-ink">Payments by status</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {Object.entries(data.paymentsByStatus).map(([status, count]) => (
                  <li key={status}>
                    <Badge>
                      {PAYMENT_STATUS[status] ?? status}: {count}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-ink">Refunds by status</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {Object.entries(data.refundsByStatus).map(([status, count]) => (
                  <li key={status}>
                    <Badge tone={status === 'FAILED' && count > 0 ? 'primary' : 'neutral'}>
                      {REFUND_STATUS[status] ?? status}: {count}
                    </Badge>
                  </li>
                ))}
              </ul>
              {data.refundsByStatus.FAILED > 0 && (
                <Link to="/admin/payments?tab=refunds" className="mt-3 inline-block text-sm font-semibold text-ink underline">
                  Review failed refunds
                </Link>
              )}
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <UpcomingList items={data.upcoming} />
            <RecentBookingsList items={data.recentBookings} />
          </div>
        </>
      )}
    </section>
  )
}

const LIST_PAGE_SIZE = 5

/** Client-side paging for the dashboard's short lists, so a long list never stretches the page. */
function usePaged(items, size = LIST_PAGE_SIZE) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(page, pages - 1)
  return { items: items.slice(current * size, current * size + size), page: current, pages, setPage }
}

function ListPager({ paged, label }) {
  if (paged.pages <= 1) return null
  return (
    <nav aria-label={`${label} pages`} className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
      <span className="text-ink-muted">
        Page {paged.page + 1} of {paged.pages}
      </span>
      <span className="flex gap-1">
        <Button variant="ghost" size="sm" disabled={paged.page === 0} onClick={() => paged.setPage(paged.page - 1)}>
          Previous
        </Button>
        <Button variant="ghost" size="sm" disabled={paged.page >= paged.pages - 1} onClick={() => paged.setPage(paged.page + 1)}>
          Next
        </Button>
      </span>
    </nav>
  )
}

function UpcomingList({ items }) {
  const paged = usePaged(items)
  return (
    <Card>
      <h3 className="text-sm font-semibold text-ink">Coming up</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">Nothing scheduled.</p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line text-sm">
            {paged.items.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{item.title}</span>
                  <span className="block text-xs text-ink-muted">{item.venueName ?? item.kind}</span>
                </span>
                <span className="shrink-0 text-right text-xs whitespace-nowrap text-ink-secondary">
                  {item.startsAt ? formatDateTime(item.startsAt) : item.releaseDate && `Releases ${formatReleaseDate(item.releaseDate)}`}
                </span>
              </li>
            ))}
          </ul>
          <ListPager paged={paged} label="Coming up" />
        </>
      )}
    </Card>
  )
}

function RecentBookingsList({ items }) {
  const paged = usePaged(items)
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Recent bookings</h3>
        <Link to="/admin/bookings" className="text-sm font-semibold text-ink underline">
          All bookings
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No bookings yet" className="py-8" />
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line text-sm">
            {paged.items.map((booking) => (
              <li key={booking.reference} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <Link to={`/admin/bookings?q=${booking.reference}`} className="font-mono text-xs font-semibold text-ink underline">
                    {booking.reference}
                  </Link>
                  <span className="block truncate font-medium text-ink">{booking.title}</span>
                  <span className="block truncate text-xs text-ink-muted">{booking.customerEmail}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-ink">{formatCurrency(booking.total, booking.currency)}</span>
                  <StatusBadge value={booking.status} labels={BOOKING_STATUS_LABEL} />
                </span>
              </li>
            ))}
          </ul>
          <ListPager paged={paged} label="Recent bookings" />
        </>
      )}
    </Card>
  )
}

export default function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard')
  return (
    <AdminPage title="Admin dashboard" description="Live catalog, sales and platform figures from the database.">
      <SystemStatusCard />
      <LiveCounts />
      <Metrics />
    </AdminPage>
  )
}
