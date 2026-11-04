import { useState } from 'react'
import { Accessibility, Plus, Trash2 } from 'lucide-react'

import { getSeatLayout, replaceSeatLayout } from '../../api/adminApi'
import { useAsync } from '../../hooks/useAsync'
import { nextRowLabel } from '../../lib/adminHelpers'
import { cn } from '../../lib/cn'
import { SEAT_TYPE } from '../../lib/labels'
import { serverFieldErrors } from '../../lib/serverErrors'
import { Alert } from '../ui/Alert'
import { Button, IconButton } from '../ui/Button'
import { LoadingState } from '../ui/States'

const MAX_ROWS = 40
const MAX_SEATS = 60
let nextKey = 0

/** The API stores seats; the editor works per row (count, type, section), like the replace request. */
function toEditableRows(layout) {
  return layout.rows
    .map((row) => {
      const active = row.seats.filter((seat) => seat.active)
      const counts = active.reduce((acc, seat) => ({ ...acc, [seat.seatType]: (acc[seat.seatType] ?? 0) + 1 }), {})
      const seatType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'STANDARD'
      return {
        key: nextKey++,
        label: row.label,
        seatCount: active.length,
        seatType,
        section: active.find((seat) => seat.section)?.section ?? '',
        mixed: Object.keys(counts).length > 1,
      }
    })
    .filter((row) => row.seatCount > 0)
}

function Preview({ rows }) {
  return (
    <div className="overflow-x-auto rounded-control border border-line bg-surface-subtle p-4">
      <p className="mb-4 rounded bg-ink/10 py-1 text-center text-xs font-semibold tracking-widest text-ink-muted uppercase">
        Screen
      </p>
      <ol aria-label="Seat map preview" className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            <span className="w-6 text-right text-xs font-semibold text-ink-muted">{row.label}</span>
            <span aria-hidden="true" className="flex gap-0.5">
              {Array.from({ length: Math.min(row.seatCount || 0, MAX_SEATS) }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    'inline-flex h-3.5 items-center justify-center rounded-sm border border-ink-muted bg-surface',
                    row.seatType === 'RECLINER' ? 'w-5' : 'w-3.5',
                    row.seatType === 'PREMIUM' && 'border-ink bg-ink/20',
                  )}
                >
                  {row.seatType === 'ACCESSIBLE' && <Accessibility size={10} />}
                </span>
              ))}
            </span>
            <span className="text-xs whitespace-nowrap text-ink-muted">
              {row.seatCount} {SEAT_TYPE[row.seatType]?.toLowerCase()}
              {row.section && ` · ${row.section}`}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Editor({ screenId, layout, onSaved }) {
  const [rows, setRows] = useState(() => toEditableRows(layout))
  const [state, setState] = useState({ busy: false, error: null, saved: false })
  const total = rows.reduce((sum, row) => sum + (Number(row.seatCount) || 0), 0)
  const fieldErrors = serverFieldErrors(state.error)

  const update = (key, changes) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes, mixed: false } : row)))
  const addRow = () =>
    setRows((current) => {
      const previous = current[current.length - 1]
      return [
        ...current,
        {
          key: nextKey++,
          label: nextRowLabel(current.map((row) => row.label)),
          seatCount: previous?.seatCount ?? 10,
          seatType: previous?.seatType ?? 'STANDARD',
          section: previous?.section ?? '',
          mixed: false,
        },
      ]
    })

  const save = async () => {
    setState({ busy: true, error: null, saved: false })
    try {
      const saved = await replaceSeatLayout(
        screenId,
        rows.map((row) => ({
          label: row.label.trim().toUpperCase(),
          seatCount: Number(row.seatCount),
          seatType: row.seatType,
          section: row.section.trim() || null,
        })),
      )
      setRows(toEditableRows(saved))
      setState({ busy: false, error: null, saved: true })
      onSaved?.(saved)
    } catch (error) {
      setState({ busy: false, error, saved: false })
    }
  }

  return (
    <div className="space-y-5">
      {rows.some((row) => row.mixed) && (
        <Alert tone="warning">
          Some rows mix seat types. The editor sets one type per row, so saving will apply the most common type to the whole row.
        </Alert>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Seat rows</caption>
          <thead className="text-xs text-ink-muted uppercase">
            <tr>
              <th scope="col" className="py-2 pr-2">
                Row
              </th>
              <th scope="col" className="py-2 pr-2">
                Seats
              </th>
              <th scope="col" className="py-2 pr-2">
                Seat type
              </th>
              <th scope="col" className="py-2 pr-2">
                Section
              </th>
              <th scope="col" className="py-2">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key}>
                <td className="py-1 pr-2">
                  <input
                    aria-label={`Row ${index + 1} label`}
                    value={row.label}
                    maxLength={2}
                    onChange={(e) => update(row.key, { label: e.target.value.toUpperCase() })}
                    className="h-9 w-16 rounded-control border border-line px-2 uppercase focus:border-ink"
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    aria-label={`Row ${row.label} seat count`}
                    type="number"
                    min="1"
                    max={MAX_SEATS}
                    value={row.seatCount}
                    onChange={(e) => update(row.key, { seatCount: e.target.value })}
                    className="h-9 w-20 rounded-control border border-line px-2 focus:border-ink"
                  />
                </td>
                <td className="py-1 pr-2">
                  <select
                    aria-label={`Row ${row.label} seat type`}
                    value={row.seatType}
                    onChange={(e) => update(row.key, { seatType: e.target.value })}
                    className="h-9 rounded-control border border-line px-2 focus:border-ink"
                  >
                    {Object.entries(SEAT_TYPE).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    aria-label={`Row ${row.label} section`}
                    value={row.section}
                    maxLength={40}
                    placeholder="e.g. Front"
                    onChange={(e) => update(row.key, { section: e.target.value })}
                    className="h-9 w-32 rounded-control border border-line px-2 focus:border-ink"
                  />
                </td>
                <td className="py-1">
                  <IconButton
                    label={`Remove row ${row.label}`}
                    icon={Trash2}
                    size={16}
                    onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" leftIcon={Plus} onClick={addRow} disabled={rows.length >= MAX_ROWS}>
          Add row
        </Button>
        <p className="text-sm text-ink-secondary">
          {rows.length} rows · {total} seats
        </p>
      </div>
      <Preview rows={rows} />
      {state.error && (
        <Alert tone="error">
          {state.error.message}
          {Object.entries(fieldErrors).length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {Object.entries(fieldErrors).map(([name, message]) => (
                <li key={name}>
                  {name}: {message}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}
      {state.saved && <Alert tone="success">Seat map saved. The screen&apos;s capacity is now {total}.</Alert>}
      <div className="flex justify-end">
        <Button onClick={save} loading={state.busy} disabled={rows.length === 0}>
          Save seat map
        </Button>
      </div>
      <p className="text-xs text-ink-muted">
        Saving replaces the whole map. Seats booked for upcoming shows cannot change, so the server refuses the change until those
        shows are over or cancelled.
      </p>
    </div>
  )
}

export function SeatMapEditor({ screenId, onSaved }) {
  const layout = useAsync(() => getSeatLayout(screenId), [screenId])
  if (layout.isLoading) return <LoadingState label="Loading seat map…" />
  if (layout.error) return <Alert tone="error">{layout.error.message}</Alert>
  return <Editor key={screenId} screenId={screenId} layout={layout.data} onSaved={onSaved} />
}
