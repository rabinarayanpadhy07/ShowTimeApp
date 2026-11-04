import { describe, expect, it } from 'vitest'

import { attendanceOf } from './attendance'

const booking = (overrides = {}) => ({
  status: 'CONFIRMED',
  type: 'MOVIE',
  startsAt: '2026-11-03T08:00:00Z',
  endsAt: '2026-11-03T10:45:00Z',
  tickets: [{ code: 'T1', status: 'USED', checkedInAt: '2026-11-03T07:50:00Z' }],
  ...overrides,
})

describe('attendanceOf', () => {
  it('is null until a ticket has been scanned', () => {
    expect(attendanceOf(booking({ tickets: [{ code: 'T1', status: 'VALID' }] }))).toBeNull()
    expect(attendanceOf(booking({ status: 'CANCELLED' }))).toBeNull()
  })

  it('is "checked in" while the show is running and "watched" once it has ended', () => {
    expect(attendanceOf(booking(), Date.parse('2026-11-03T09:00:00Z'))).toMatchObject({ state: 'CHECKED_IN', label: 'Checked in' })
    expect(attendanceOf(booking(), Date.parse('2026-11-03T11:00:00Z'))).toEqual({
      state: 'ATTENDED',
      label: 'Watched',
      checkedInAt: '2026-11-03T07:50:00Z',
    })
  })

  it('says "attended" for events and falls back to the start time without an end time', () => {
    const event = booking({ type: 'EVENT', endsAt: null })
    expect(attendanceOf(event, Date.parse('2026-11-03T08:30:00Z'))).toMatchObject({ label: 'Attended' })
  })
})
