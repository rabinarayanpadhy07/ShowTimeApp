// Converts between UTC instants and wall-clock values ("YYYY-MM-DDTHH:mm", as used by
// <input type="datetime-local">) in a given IANA time zone, independent of the browser's zone.
// Admins schedule a show in the venue's local time, so 19:00 in Mumbai stays 19:00 in Mumbai.

function parts(date, timeZone) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  )
  return values
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds. */
function offsetAt(date, timeZone) {
  const p = parts(date, timeZone)
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return asUtc - (date.getTime() - date.getMilliseconds())
}

/** "2026-11-02T19:00" in Asia/Kolkata -> "2026-11-02T13:30:00.000Z". Empty input -> null. */
export function zonedToIso(local, timeZone) {
  if (!local) return null
  const [datePart, timePart = '00:00'] = local.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  // Two passes settle the offset correctly around DST transitions.
  let instant = guess - offsetAt(new Date(guess), timeZone)
  instant = guess - offsetAt(new Date(instant), timeZone)
  return new Date(instant).toISOString()
}

/** "2026-11-02T13:30:00Z" -> "2026-11-02T19:00" in Asia/Kolkata. Empty input -> "". */
export function isoToZoned(iso, timeZone) {
  if (!iso) return ''
  const p = parts(new Date(iso), timeZone)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}
