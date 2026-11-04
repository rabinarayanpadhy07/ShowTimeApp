import { useState } from 'react'

import { options, SCREEN_TYPE } from '../../lib/adminLabels'
import { VENUE_TYPE } from '../../lib/labels'
import { slugify } from '../../lib/slugify'
import { Checkbox, SelectField, TextField } from '../ui/FormControls'

export function VenueFields({ venue, errors }) {
  const [slug, setSlug] = useState(venue?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(venue))
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Name"
          name="name"
          required
          defaultValue={venue?.name}
          onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
          error={errors.name}
        />
        <TextField
          label="URL slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          error={errors.slug}
        />
        <SelectField
          label="Venue type"
          name="venueType"
          required
          defaultValue={venue?.venueType ?? 'CINEMA'}
          options={options(VENUE_TYPE)}
          error={errors.venueType}
        />
        <TextField
          label="Time zone"
          name="timeZone"
          required
          defaultValue={venue?.timeZone ?? 'Asia/Kolkata'}
          hint="IANA name, e.g. Asia/Kolkata"
          error={errors.timeZone}
        />
      </div>
      <TextField label="Address" name="addressLine1" required defaultValue={venue?.addressLine1} error={errors.addressLine1} />
      <TextField
        label="Address line 2"
        name="addressLine2"
        defaultValue={venue?.addressLine2 ?? ''}
        error={errors.addressLine2}
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <TextField label="City" name="city" required defaultValue={venue?.city} error={errors.city} />
        <TextField label="State" name="state" defaultValue={venue?.state ?? ''} error={errors.state} />
        <TextField label="Postal code" name="postalCode" defaultValue={venue?.postalCode ?? ''} error={errors.postalCode} />
        <TextField
          label="Country"
          name="countryCode"
          required
          maxLength={2}
          defaultValue={venue?.countryCode ?? 'IN'}
          error={errors.countryCode}
        />
      </div>
      <Checkbox
        name="active"
        label="Active"
        description="Inactive venues cannot be scheduled. A venue with upcoming shows or events cannot be deactivated."
        defaultChecked={venue?.active ?? true}
      />
    </>
  )
}

export function ScreenFields({ screen, errors }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Name"
          name="name"
          required
          defaultValue={screen?.name}
          hint="e.g. Audi 1, Main Hall"
          error={errors.name}
          className="sm:col-span-2"
        />
        <SelectField
          label="Type"
          name="screenType"
          required
          defaultValue={screen?.screenType ?? 'STANDARD'}
          options={options(SCREEN_TYPE)}
          error={errors.screenType}
        />
        <TextField
          label="Capacity"
          name="capacity"
          type="number"
          min="1"
          required
          defaultValue={screen?.capacity}
          hint="With a seat map, this follows the number of seats"
          error={errors.capacity}
        />
      </div>
      <Checkbox
        name="active"
        label="Active"
        description="Inactive screens cannot be scheduled."
        defaultChecked={screen?.active ?? true}
      />
    </>
  )
}
