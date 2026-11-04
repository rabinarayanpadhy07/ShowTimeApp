import { useState } from 'react'

import { listUsers, updateUser } from '../../api/adminApi'
import { AdminPage, ConfirmDialog, DataTable, FilterBar, StatusBadge } from '../../components/admin/AdminUi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/FormControls'
import { SearchInput } from '../../components/ui/SearchInput'
import { useAuth } from '../../context/AuthContext'
import { useAdminList } from '../../hooks/useAdminList'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { options, USER_ROLE } from '../../lib/adminLabels'
import { formatDateTime } from '../../lib/format'

/** The change a button makes, with the wording for its confirmation. */
const ACTIONS = {
  promote: {
    body: { role: 'ADMIN' },
    label: 'Make administrator',
    text: 'They will be able to manage the catalog, bookings, refunds and users.',
  },
  demote: {
    body: { role: 'USER' },
    label: 'Remove administrator',
    text: 'They will keep their account and bookings but lose admin access.',
  },
  disable: {
    body: { enabled: false },
    label: 'Disable account',
    text: 'They cannot sign in until re-enabled and their saved sessions are revoked (an open session ends within 15 minutes).',
  },
  enable: { body: { enabled: true }, label: 'Enable account', text: 'They will be able to sign in again.' },
}

export default function AdminUsersPage() {
  useDocumentTitle('Users · Admin')
  const { user: me } = useAuth()
  const list = useAdminList(listUsers, { q: '', role: '', enabled: '', sort: 'createdAt,desc' })
  const [pending, setPending] = useState(null)

  const columns = [
    {
      header: 'User',
      cell: (u) => (
        <span>
          <span className="block font-semibold text-ink">
            {u.fullName} {u.id === me?.id && <Badge>you</Badge>}
          </span>
          <span className="block text-xs text-ink-muted">{u.email}</span>
        </span>
      ),
    },
    { header: 'Role', cell: (u) => <StatusBadge value={u.role} labels={USER_ROLE} /> },
    {
      header: 'Account',
      cell: (u) => <Badge tone={u.enabled ? 'success' : 'neutral'}>{u.enabled ? 'Enabled' : 'Disabled'}</Badge>,
    },
    { header: 'Bookings', cell: (u) => u.bookings, className: 'text-right' },
    { header: 'Joined', cell: (u) => formatDateTime(u.createdAt), className: 'text-xs whitespace-nowrap' },
    {
      header: 'Last sign-in',
      cell: (u) => (u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'),
      className: 'text-xs whitespace-nowrap',
    },
    {
      header: 'Actions',
      cell: (u) =>
        u.id === me?.id ? (
          <span className="text-xs text-ink-muted">Ask another admin</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPending({ user: u, action: u.role === 'ADMIN' ? 'demote' : 'promote' })}
            >
              {u.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending({ user: u, action: u.enabled ? 'disable' : 'enable' })}>
              {u.enabled ? 'Disable' : 'Enable'}
            </Button>
          </span>
        ),
    },
  ]

  const action = pending && ACTIONS[pending.action]

  return (
    <AdminPage
      title="Users"
      description="Customer and administrator accounts. At least one enabled administrator always remains."
    >
      <FilterBar>
        <SearchInput label="Search users" placeholder="Name or email" onSearch={(q) => list.setFilter('q', q)} />
        <SelectField
          label="Role"
          value={list.filters.role}
          onChange={(e) => list.setFilter('role', e.target.value)}
          placeholder="All roles"
          options={options(USER_ROLE)}
        />
        <SelectField
          label="Account"
          value={list.filters.enabled}
          onChange={(e) => list.setFilter('enabled', e.target.value)}
          placeholder="Enabled and disabled"
          options={[
            { value: 'true', label: 'Enabled' },
            { value: 'false', label: 'Disabled' },
          ]}
        />
        <SelectField
          label="Sort"
          value={list.filters.sort}
          onChange={(e) => list.setFilter('sort', e.target.value)}
          options={[
            { value: 'createdAt,desc', label: 'Newest first' },
            { value: 'email,asc', label: 'Email A–Z' },
            { value: 'lastLoginAt,desc', label: 'Recently signed in' },
          ]}
        />
      </FilterBar>
      <DataTable label="Users" columns={columns} list={list} emptyTitle="No users match" />
      {pending && (
        <ConfirmDialog
          open
          onClose={() => setPending(null)}
          title={`${action.label}: ${pending.user.fullName}?`}
          confirmLabel={action.label}
          tone={pending.action === 'disable' || pending.action === 'demote' ? 'danger' : 'primary'}
          onConfirm={async () => {
            await updateUser(pending.user.id, action.body)
            list.reload()
          }}
        >
          <p>
            {pending.user.email}. {action.text}
          </p>
        </ConfirmDialog>
      )}
    </AdminPage>
  )
}
