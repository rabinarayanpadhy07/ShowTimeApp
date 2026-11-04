import { describe, expect, it } from 'vitest'

import { nextRowLabel, niceMax } from './adminHelpers'
import { eventDatePayload, showPayload, venuePayload } from './adminPayloads'
import { slugify } from './slugify'
import { isoToZoned, zonedToIso } from './zonedTime'

const formData = (entries) => {
  const form = new FormData()
  for (const [name, value] of Object.entries(entries)) {
    for (const item of [value].flat()) form.append(name, item)
  }
  return form
}

describe('zoned time', () => {
  it('reads wall-clock input in the venue time zone, not the browser zone', () => {
    expect(zonedToIso('2026-11-02T19:00', 'Asia/Kolkata')).toBe('2026-11-02T13:30:00.000Z')
    expect(zonedToIso('2026-07-01T09:15', 'Europe/London')).toBe('2026-07-01T08:15:00.000Z')
    expect(zonedToIso('2026-01-15T09:15', 'Europe/London')).toBe('2026-01-15T09:15:00.000Z')
    expect(zonedToIso('', 'Asia/Kolkata')).toBeNull()
  })

  it('shows instants as wall-clock values in the venue time zone', () => {
    expect(isoToZoned('2026-11-02T13:30:00Z', 'Asia/Kolkata')).toBe('2026-11-02T19:00')
    expect(isoToZoned('2026-11-02T23:45:00Z', 'Asia/Kolkata')).toBe('2026-11-03T05:15')
    expect(isoToZoned(null, 'Asia/Kolkata')).toBe('')
  })

  it('round-trips across a daylight-saving change', () => {
    const local = '2026-03-29T03:30'
    expect(isoToZoned(zonedToIso(local, 'Europe/London'), 'Europe/London')).toBe(local)
  })
})

describe('admin helpers', () => {
  it('makes slugs the API accepts', () => {
    expect(slugify("The Clockmaker's Daughter!")).toBe('the-clockmakers-daughter')
    expect(slugify('  Café   Nights — Live  ')).toBe('cafe-nights-live')
  })

  it('rounds chart maxima to clean values', () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(7)).toBe(10)
    expect(niceMax(1250)).toBe(2000)
    expect(niceMax(2100)).toBe(2500)
    expect(niceMax(42000)).toBe(50000)
  })

  it('continues seat row labels', () => {
    expect(nextRowLabel([])).toBe('A')
    expect(nextRowLabel(['A', 'B'])).toBe('C')
    expect(nextRowLabel(['Z'])).toBe('AA')
    expect(nextRowLabel(['AA'])).toBe('AB')
    expect(nextRowLabel(['AZ'])).toBe('BA')
  })
})

describe('admin payloads', () => {
  it('builds a show body in the venue time zone with blanks as null', () => {
    const body = showPayload(
      formData({ screenId: '3', startsAt: '2026-11-02T19:00', timeZone: 'Asia/Kolkata', format: 'TWO_D', language: ' Hindi ', basePrice: '250', premiumPrice: '' }),
    )
    expect(body).toEqual({ screenId: 3, startsAt: '2026-11-02T13:30:00.000Z', format: 'TWO_D', language: 'Hindi', basePrice: 250, premiumPrice: null })
  })

  it('builds an event date body', () => {
    const body = eventDatePayload(
      formData({ venueId: '2', screenId: '', seatingType: 'GENERAL_ADMISSION', timeZone: 'Asia/Kolkata', startsAt: '2026-12-31T20:00', capacity: '500', basePrice: '999' }),
    )
    expect(body).toMatchObject({ venueId: 2, screenId: null, seatingType: 'GENERAL_ADMISSION', startsAt: '2026-12-31T14:30:00.000Z', endsAt: null, capacity: 500 })
  })

  it('reads checkboxes and upper-cases the country code', () => {
    expect(venuePayload(formData({ name: 'X', countryCode: 'in', active: 'on' }))).toMatchObject({ countryCode: 'IN', active: true })
    expect(venuePayload(formData({ name: 'X', countryCode: 'IN' }))).toMatchObject({ active: false })
  })
})
