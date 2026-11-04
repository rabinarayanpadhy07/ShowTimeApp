import { listAuditLogs } from '../../api/adminApi'
import { AdminPage, DataTable, FilterBar } from '../../components/admin/AdminUi'
import { SelectField, TextField } from '../../components/ui/FormControls'
import { SearchInput } from '../../components/ui/SearchInput'
import { useAdminList } from '../../hooks/useAdminList'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatDateTime } from '../../lib/format'

const ENTITY_TYPES = ['Movie', 'Event', 'MovieShow', 'EventSchedule', 'Venue', 'Screen', 'Payment', 'Refund', 'User', 'Ticket']

const humanize = (action) =>
  action
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())

export default function AdminAuditPage() {
  useDocumentTitle('Audit log · Admin')
  const list = useAdminList(listAuditLogs, { q: '', entityType: '', from: '', to: '' }, { size: 25 })

  const columns = [
    { header: 'When', cell: (log) => formatDateTime(log.createdAt), className: 'text-xs whitespace-nowrap' },
    { header: 'Who', cell: (log) => log.actorEmail ?? 'system' },
    { header: 'Action', cell: (log) => <span className="font-medium text-ink">{humanize(log.action)}</span> },
    {
      header: 'Target',
      cell: (log) => (
        <span className="whitespace-nowrap">
          {log.entityType}
          {log.entityId && <span className="font-mono text-xs text-ink-muted"> #{log.entityId}</span>}
        </span>
      ),
    },
    {
      header: 'Details',
      cell: (log) => <span className="block max-w-md text-xs break-words text-ink-secondary">{log.details ?? '—'}</span>,
    },
  ]

  return (
    <AdminPage
      title="Audit log"
      description="Every administrative change and ticket check-in, newest first. Entries cannot be edited or deleted."
    >
      <FilterBar>
        <SearchInput
          label="Search the log"
          placeholder="Action, admin email or details"
          onSearch={(q) => list.setFilter('q', q)}
        />
        <SelectField
          label="Target type"
          value={list.filters.entityType}
          onChange={(e) => list.setFilter('entityType', e.target.value)}
          placeholder="Everything"
          options={ENTITY_TYPES.map((type) => ({ value: type, label: type }))}
        />
        <TextField label="From" type="date" value={list.filters.from} onChange={(e) => list.setFilter('from', e.target.value)} />
        <TextField label="To" type="date" value={list.filters.to} onChange={(e) => list.setFilter('to', e.target.value)} />
      </FilterBar>
      <DataTable label="Audit log" columns={columns} list={list} emptyTitle="No entries match" />
    </AdminPage>
  )
}
