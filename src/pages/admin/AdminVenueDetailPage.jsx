import { useState } from 'react'
import { ArrowLeft, Grid3x3, Pencil, Plus } from 'lucide-react'
import { useParams } from 'react-router'

import { createScreen, getAdminVenue, updateScreen, updateVenue } from '../../api/adminApi'
import { AdminPage, FormDialog } from '../../components/admin/AdminUi'
import { SeatMapEditor } from '../../components/admin/SeatMapEditor'
import { ScreenFields, VenueFields } from '../../components/admin/VenueForms'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Section'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { screenPayload, venuePayload } from '../../lib/adminPayloads'
import { SCREEN_TYPE } from '../../lib/adminLabels'
import { VENUE_TYPE } from '../../lib/labels'

export default function AdminVenueDetailPage() {
  const { id } = useParams()
  const venue = useAsync(() => getAdminVenue(id), [id])
  const [dialog, setDialog] = useState(null)
  const [seatScreenId, setSeatScreenId] = useState(null)
  useDocumentTitle(venue.data ? `${venue.data.name} · Admin` : 'Venue · Admin')
  const close = () => setDialog(null)

  if (venue.isLoading && !venue.data) return <LoadingState label="Loading venue…" />
  if (venue.error) {
    return venue.error.code === 'NOT_FOUND' ? (
      <EmptyState title="Venue not found" action={<Button to="/admin/venues">All venues</Button>} />
    ) : (
      <ErrorState message={venue.error.message} onRetry={venue.reload} />
    )
  }
  const v = venue.data
  const seatScreen = v.screens.find((screen) => screen.id === seatScreenId)

  return (
    <AdminPage
      title={v.name}
      description={`${VENUE_TYPE[v.venueType]} · ${[v.addressLine1, v.addressLine2, v.city, v.state, v.postalCode].filter(Boolean).join(', ')} · ${v.timeZone}`}
      actions={
        <>
          <Button variant="ghost" leftIcon={ArrowLeft} to="/admin/venues">
            All venues
          </Button>
          <Button variant="outline" leftIcon={Pencil} onClick={() => setDialog({ type: 'venue' })}>
            Edit venue
          </Button>
        </>
      }
    >
      {!v.active && <Badge>Inactive</Badge>}
      <Card className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Screens and halls</h2>
          <Button size="sm" leftIcon={Plus} onClick={() => setDialog({ type: 'screen' })}>
            Add screen
          </Button>
        </div>
        {v.screens.length === 0 ? (
          <EmptyState
            title="No screens yet"
            message="Add a screen or hall, then give it a seat map for reserved seating."
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <table aria-label="Screens" className="w-full text-left text-sm">
              <thead className="bg-surface-subtle text-xs text-ink-muted uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Screen
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Capacity
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Seats
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {v.screens.map((screen) => (
                  <tr key={screen.id}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">
                      {screen.name}
                    </th>
                    <td className="px-4 py-3">{SCREEN_TYPE[screen.screenType] ?? screen.screenType}</td>
                    <td className="px-4 py-3 text-right">{screen.capacity}</td>
                    <td className="px-4 py-3 text-right">{screen.activeSeats || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={screen.active ? 'success' : 'neutral'}>{screen.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex gap-1">
                        <Button size="sm" variant="ghost" leftIcon={Pencil} onClick={() => setDialog({ type: 'screen', screen })}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={seatScreenId === screen.id ? 'dark' : 'ghost'}
                          leftIcon={Grid3x3}
                          aria-pressed={seatScreenId === screen.id}
                          onClick={() => setSeatScreenId(seatScreenId === screen.id ? null : screen.id)}
                        >
                          Seat map
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {seatScreen && (
        <Card>
          <h2 className="mb-1 text-base font-semibold text-ink">Seat map · {seatScreen.name}</h2>
          <p className="mb-5 text-sm text-ink-muted">
            Rows run front (nearest the screen) to back. Each row has one seat type; prices come from each show&apos;s base and
            premium price.
          </p>
          <SeatMapEditor screenId={seatScreen.id} onSaved={venue.reload} />
        </Card>
      )}

      {dialog?.type === 'venue' && (
        <FormDialog
          open
          onClose={close}
          title="Edit venue"
          onSubmit={async (form) => {
            await updateVenue(v.id, venuePayload(form))
            venue.reload()
          }}
        >
          {(errors) => <VenueFields venue={v} errors={errors} />}
        </FormDialog>
      )}
      {dialog?.type === 'screen' && (
        <FormDialog
          open
          onClose={close}
          size="md"
          title={dialog.screen ? `Edit ${dialog.screen.name}` : 'Add screen'}
          submitLabel={dialog.screen ? 'Save' : 'Add screen'}
          onSubmit={async (form) => {
            if (dialog.screen) await updateScreen(dialog.screen.id, screenPayload(form))
            else await createScreen(v.id, screenPayload(form))
            venue.reload()
          }}
        >
          {(errors) => <ScreenFields screen={dialog.screen} errors={errors} />}
        </FormDialog>
      )}
    </AdminPage>
  )
}
