import { useState } from 'react'
import { RefreshCw, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'

import { listPayments, listRefunds, reconcilePayment, retryRefund } from '../../api/adminApi'
import { AdminPage, DataTable, FilterBar, StatusBadge } from '../../components/admin/AdminUi'
import { Tabs } from '../../components/admin/Tabs'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/FormControls'
import { SearchInput } from '../../components/ui/SearchInput'
import { useAdminList } from '../../hooks/useAdminList'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useTab } from '../../hooks/useTab'
import { options, PAYMENT_STATUS, REFUND_REASON, REFUND_STATUS } from '../../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../../lib/format'

const TABS = [
  { id: 'payments', label: 'Payments' },
  { id: 'refunds', label: 'Refunds' },
]

const OPEN_STATUSES = new Set(['PENDING', 'AUTHORIZED', 'FAILED'])

/** Runs a row action and reports its outcome above the table. */
function useRowAction(onDone) {
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState(null)
  const run = async (id, action, success) => {
    setBusyId(id)
    setMessage(null)
    try {
      await action(id)
      setMessage({ tone: 'success', text: success })
      onDone()
    } catch (error) {
      setMessage({ tone: 'error', text: error.message })
    } finally {
      setBusyId(null)
    }
  }
  return { busyId, message, run }
}

const bookingLink = (reference) => (
  <Link to={`/admin/bookings?q=${reference}`} className="font-mono text-xs font-semibold text-ink underline">
    {reference}
  </Link>
)

function PaymentsTab() {
  const list = useAdminList(listPayments, { q: '', status: '', provider: '', from: '', to: '', sort: 'createdAt,desc' })
  const action = useRowAction(list.reload)

  const columns = [
    { header: 'Payment', cell: (p) => <span className="font-mono text-xs">#{p.id}</span> },
    { header: 'Booking', cell: (p) => bookingLink(p.bookingReference) },
    {
      header: 'Provider',
      cell: (p) => (
        <span>
          <span className="block">
            {p.provider} {p.testMode && <Badge tone="promo">test</Badge>}
          </span>
          <span className="block font-mono text-xs text-ink-muted">{p.providerPaymentId ?? p.providerOrderId ?? '—'}</span>
        </span>
      ),
    },
    { header: 'Amount', cell: (p) => formatCurrency(p.amount, p.currency), className: 'text-right whitespace-nowrap' },
    {
      header: 'Status',
      cell: (p) => (
        <span>
          <StatusBadge value={p.status} labels={PAYMENT_STATUS} />
          {p.failureReason && <span className="mt-1 block max-w-56 text-xs text-ink-muted">{p.failureReason}</span>}
        </span>
      ),
    },
    {
      header: 'Created',
      cell: (p) => (
        <span className="text-xs whitespace-nowrap">
          {formatDateTime(p.createdAt)}
          {p.lastCheckedAt && <span className="block text-ink-muted">checked {formatDateTime(p.lastCheckedAt)}</span>}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (p) =>
        OPEN_STATUSES.has(p.status) && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={RefreshCw}
            loading={action.busyId === p.id}
            onClick={() => action.run(p.id, reconcilePayment, `Payment #${p.id} checked with the provider.`)}
          >
            Ask provider now
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <FilterBar>
        <SearchInput
          label="Search payments"
          placeholder="Booking reference or provider id"
          onSearch={(q) => list.setFilter('q', q)}
        />
        <SelectField
          label="Status"
          value={list.filters.status}
          onChange={(e) => list.setFilter('status', e.target.value)}
          placeholder="All statuses"
          options={options(PAYMENT_STATUS)}
        />
        <TextField label="From" type="date" value={list.filters.from} onChange={(e) => list.setFilter('from', e.target.value)} />
        <TextField label="To" type="date" value={list.filters.to} onChange={(e) => list.setFilter('to', e.target.value)} />
      </FilterBar>
      <p className="text-xs text-ink-muted">
        Open attempts are reconciled with the provider automatically every minute. “Ask provider now” does it immediately.
      </p>
      {action.message && <Alert tone={action.message.tone}>{action.message.text}</Alert>}
      <DataTable label="Payments" columns={columns} list={list} emptyTitle="No payments match" />
    </div>
  )
}

function RefundsTab() {
  const list = useAdminList(listRefunds, { status: '' })
  const action = useRowAction(list.reload)

  const columns = [
    { header: 'Refund', cell: (r) => <span className="font-mono text-xs">#{r.id}</span> },
    { header: 'Booking', cell: (r) => bookingLink(r.bookingReference) },
    { header: 'Reason', cell: (r) => REFUND_REASON[r.reason] ?? r.reason },
    { header: 'Amount', cell: (r) => formatCurrency(r.amount, r.currency), className: 'text-right whitespace-nowrap' },
    {
      header: 'Status',
      cell: (r) => (
        <span>
          <StatusBadge value={r.status} labels={REFUND_STATUS} />
          {r.failureReason && <span className="mt-1 block max-w-56 text-xs text-ink-muted">{r.failureReason}</span>}
        </span>
      ),
    },
    {
      header: 'Dates',
      cell: (r) => (
        <span className="text-xs whitespace-nowrap">
          {formatDateTime(r.createdAt)}
          {r.processedAt && <span className="block text-ink-muted">processed {formatDateTime(r.processedAt)}</span>}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (r) =>
        r.status === 'FAILED' && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={RotateCcw}
            loading={action.busyId === r.id}
            onClick={() => action.run(r.id, retryRefund, `Refund #${r.id} sent to the provider again.`)}
          >
            Retry
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <FilterBar>
        <SelectField
          label="Status"
          value={list.filters.status}
          onChange={(e) => list.setFilter('status', e.target.value)}
          placeholder="All statuses"
          options={options(REFUND_STATUS)}
        />
      </FilterBar>
      {action.message && <Alert tone={action.message.tone}>{action.message.text}</Alert>}
      <DataTable label="Refunds" columns={columns} list={list} emptyTitle="No refunds match" />
    </div>
  )
}

export default function AdminPaymentsPage() {
  useDocumentTitle('Payments · Admin')
  const [tab, setTab] = useTab(TABS)
  return (
    <AdminPage
      title="Payments & refunds"
      description="Provider payment attempts and refunds. ShowTime never stores card details."
    >
      <Tabs label="Payments or refunds" tabs={TABS} current={tab} onSelect={setTab} />
      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'payments' ? <PaymentsTab /> : <RefundsTab />}
      </div>
    </AdminPage>
  )
}
