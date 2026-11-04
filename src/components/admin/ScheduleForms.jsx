import { useState } from 'react'

import { getAdminVenue, listAdminVenues } from '../../api/adminApi'
import { useAsync } from '../../hooks/useAsync'
import { options, SEATING_TYPE, SHOW_FORMAT } from '../../lib/adminLabels'
import { DEFAULT_TIME_ZONE } from '../../lib/adminPayloads'
import { isoToZoned } from '../../lib/zonedTime'
import { SelectField, TextField } from '../ui/FormControls'

/**
 * Venue and screen selects. The chosen venue's time zone travels in a hidden `timeZone` field,
 * so times entered in the form are read as that venue's local time; `children(timeZone)` renders
 * the fields that display times.
 */
export function VenueScreenPicker({
  defaultVenueId,
  defaultScreenId,
  screenRequired = true,
  screenLabel = 'Screen',
  errors = {},
  children,
}) {
  const [venueId, setVenueId] = useState(defaultVenueId ? String(defaultVenueId) : '')
  const venues = useAsync(() => listAdminVenues({ size: 100 }), [])
  const venue = useAsync(() => (venueId ? getAdminVenue(venueId) : Promise.resolve(null)), [venueId])
  const timeZone = venue.data?.timeZone ?? DEFAULT_TIME_ZONE
  const screens = (venue.data?.screens ?? []).filter((screen) => screen.active || String(screen.id) === String(defaultScreenId))

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Venue"
          name="venueId"
          required
          value={venueId}
          onChange={(event) => setVenueId(event.target.value)}
          placeholder={venues.isLoading ? 'Loading venues…' : 'Choose a venue'}
          options={(venues.data?.content ?? [])
            .filter((v) => v.active)
            .map((v) => ({ value: String(v.id), label: `${v.name} · ${v.city}` }))}
          error={errors.venueId}
        />
        <SelectField
          key={venueId}
          label={screenLabel}
          name="screenId"
          required={screenRequired}
          defaultValue={defaultScreenId ? String(defaultScreenId) : ''}
          disabled={!venueId || venue.isLoading}
          placeholder={venueId ? (screenRequired ? 'Choose a screen' : 'No screen') : 'Choose a venue first'}
          options={screens.map((screen) => ({
            value: String(screen.id),
            label: `${screen.name} · ${screen.activeSeats ? `${screen.activeSeats} seats` : `capacity ${screen.capacity}`}`,
          }))}
          error={errors.screenId}
        />
        <input type="hidden" name="timeZone" value={timeZone} />
        {venue.data && (
          <p className="text-xs text-ink-muted sm:col-span-2">Times are in the venue&apos;s time zone ({timeZone}).</p>
        )}
      </div>
      {/* Re-keyed when the zone changes so existing times are shown in the new venue's zone. */}
      {children && <div key={timeZone}>{children(timeZone)}</div>}
    </>
  )
}

/** Fields for a movie show (create and edit share one body). */
export function ShowFields({ show, defaultLanguage, errors }) {
  return (
    <VenueScreenPicker defaultVenueId={show?.venueId} defaultScreenId={show?.screenId} errors={errors}>
      {(zone) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Starts at"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={show ? isoToZoned(show.startsAt, zone) : ''}
            error={errors.startsAt}
          />
          <SelectField
            label="Format"
            name="format"
            required
            defaultValue={show?.format ?? 'TWO_D'}
            options={options(SHOW_FORMAT)}
            error={errors.format}
          />
          <TextField
            label="Language"
            name="language"
            required
            defaultValue={show?.language ?? defaultLanguage ?? ''}
            error={errors.language}
          />
          <TextField
            label="Base price (₹)"
            name="basePrice"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={show?.basePrice ?? ''}
            error={errors.basePrice}
          />
          <TextField
            label="Premium price (₹)"
            name="premiumPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={show?.premiumPrice ?? ''}
            hint="Premium and recliner seats"
            error={errors.premiumPrice}
          />
        </div>
      )}
    </VenueScreenPicker>
  )
}

/** Fields for a new event date: venue, seating type, then a screen or a capacity. */
export function EventDateCreateFields({ errors }) {
  const [seating, setSeating] = useState('GENERAL_ADMISSION')
  return (
    <>
      <SelectField
        label="Seating"
        name="seatingType"
        required
        value={seating}
        onChange={(event) => setSeating(event.target.value)}
        options={options(SEATING_TYPE)}
        error={errors.seatingType}
      />
      <VenueScreenPicker
        screenRequired={seating === 'RESERVED'}
        screenLabel={seating === 'RESERVED' ? 'Hall with a seat map' : 'Hall (optional)'}
        errors={errors}
      >
        {(zone) => <EventTimingFields errors={errors} timeZone={zone} showCapacity={seating === 'GENERAL_ADMISSION'} />}
      </VenueScreenPicker>
    </>
  )
}

/** Times, capacity and prices of an event date (shared by create and edit). */
export function EventTimingFields({ schedule, errors, showCapacity, timeZone: zone = DEFAULT_TIME_ZONE }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <TextField
        label="Starts at"
        name="startsAt"
        type="datetime-local"
        required
        defaultValue={schedule ? isoToZoned(schedule.startsAt, zone) : ''}
        error={errors.startsAt}
      />
      <TextField
        label="Ends at"
        name="endsAt"
        type="datetime-local"
        defaultValue={schedule ? isoToZoned(schedule.endsAt, zone) : ''}
        error={errors.endsAt}
      />
      <TextField label="Doors open" name="doorsOpenAt" type="datetime-local" error={errors.doorsOpenAt} />
      {showCapacity && (
        <TextField
          label="Capacity"
          name="capacity"
          type="number"
          min="1"
          required
          defaultValue={schedule?.capacity ?? ''}
          error={errors.capacity}
        />
      )}
      <TextField
        label="Base price (₹)"
        name="basePrice"
        type="number"
        min="0"
        step="0.01"
        required
        defaultValue={schedule?.basePrice ?? ''}
        error={errors.basePrice}
      />
      <TextField
        label="Premium price (₹)"
        name="premiumPrice"
        type="number"
        min="0"
        step="0.01"
        defaultValue={schedule?.premiumPrice ?? ''}
        error={errors.premiumPrice}
      />
    </div>
  )
}
