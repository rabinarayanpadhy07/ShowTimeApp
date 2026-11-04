// Builds admin API request bodies from submitted forms (blank fields become null).

import { field, numberField } from './formData'
import { zonedToIso } from './zonedTime'

export const DEFAULT_TIME_ZONE = 'Asia/Kolkata'

/** The venue time zone a VenueScreenPicker put in the form. */
const zoneOf = (form) => field(form, 'timeZone') ?? DEFAULT_TIME_ZONE

export function showPayload(form) {
  return {
    screenId: numberField(form, 'screenId'),
    startsAt: zonedToIso(field(form, 'startsAt'), zoneOf(form)),
    format: field(form, 'format'),
    language: field(form, 'language'),
    basePrice: numberField(form, 'basePrice'),
    premiumPrice: numberField(form, 'premiumPrice'),
  }
}

export function eventDatePayload(form, timeZone = zoneOf(form)) {
  return {
    venueId: numberField(form, 'venueId'),
    screenId: numberField(form, 'screenId'),
    seatingType: field(form, 'seatingType'),
    startsAt: zonedToIso(field(form, 'startsAt'), timeZone),
    endsAt: zonedToIso(field(form, 'endsAt'), timeZone),
    doorsOpenAt: zonedToIso(field(form, 'doorsOpenAt'), timeZone),
    capacity: numberField(form, 'capacity'),
    basePrice: numberField(form, 'basePrice'),
    premiumPrice: numberField(form, 'premiumPrice'),
  }
}

export const venuePayload = (form) => ({
  name: field(form, 'name'),
  slug: field(form, 'slug'),
  venueType: field(form, 'venueType'),
  addressLine1: field(form, 'addressLine1'),
  addressLine2: field(form, 'addressLine2'),
  city: field(form, 'city'),
  state: field(form, 'state'),
  postalCode: field(form, 'postalCode'),
  countryCode: field(form, 'countryCode')?.toUpperCase() ?? null,
  timeZone: field(form, 'timeZone'),
  active: form.get('active') === 'on',
})

export const screenPayload = (form) => ({
  name: field(form, 'name'),
  screenType: field(form, 'screenType'),
  capacity: numberField(form, 'capacity'),
  active: form.get('active') === 'on',
})
