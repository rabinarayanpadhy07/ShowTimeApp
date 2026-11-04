import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'

import { createVenue, listAdminVenues } from '../../api/adminApi'
import { AdminPage, DataTable, FilterBar, FormDialog } from '../../components/admin/AdminUi'
import { VenueFields } from '../../components/admin/VenueForms'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SearchInput } from '../../components/ui/SearchInput'
import { useAdminList } from '../../hooks/useAdminList'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { venuePayload } from '../../lib/adminPayloads'
import { VENUE_TYPE } from '../../lib/labels'

export default function AdminVenuesPage() {
  useDocumentTitle('Venues · Admin')
  const list = useAdminList(listAdminVenues, { q: '' })
  const [creating, setCreating] = useState(false)

  const columns = [
    {
      header: 'Venue',
      cell: (venue) => (
        <Link to={`/admin/venues/${venue.id}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          {venue.name}
        </Link>
      ),
    },
    { header: 'Type', cell: (venue) => VENUE_TYPE[venue.venueType] ?? venue.venueType },
    { header: 'City', cell: (venue) => venue.city },
    { header: 'Screens', cell: (venue) => venue.screens, className: 'text-right' },
    { header: 'Time zone', cell: (venue) => venue.timeZone },
    {
      header: 'Status',
      cell: (venue) => <Badge tone={venue.active ? 'success' : 'neutral'}>{venue.active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      cell: (venue) => (
        <Button size="sm" variant="ghost" to={`/admin/venues/${venue.id}`}>
          Screens & seats
        </Button>
      ),
    },
  ]

  return (
    <AdminPage
      title="Venues & seats"
      description="Cinemas and event venues, their screens or halls, and seat maps."
      actions={
        <Button leftIcon={Plus} onClick={() => setCreating(true)}>
          New venue
        </Button>
      }
    >
      <FilterBar>
        <SearchInput
          label="Search venues"
          placeholder="Name or city"
          onSearch={(q) => list.setFilter('q', q)}
          className="sm:col-span-2"
        />
      </FilterBar>
      <DataTable label="Venues" columns={columns} list={list} emptyTitle="No venues match" />
      {creating && (
        <FormDialog
          open
          onClose={() => setCreating(false)}
          title="New venue"
          submitLabel="Create venue"
          onSubmit={async (form) => {
            await createVenue(venuePayload(form))
            list.reload()
          }}
        >
          {(errors) => <VenueFields errors={errors} />}
        </FormDialog>
      )}
    </AdminPage>
  )
}
