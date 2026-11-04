// Formatting helpers. Instants from the API are ISO-8601 UTC strings; they are
// always displayed in the venue's own IANA time zone.

const DEFAULT_LOCALE = 'en-IN'
const DEFAULT_TIME_ZONE = 'Asia/Kolkata'

/** Money is handled in minor units (paise) to avoid floating-point drift. */
export function toMinorUnits(amount) {
  return Math.round(Number(amount) * 100)
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatMinorUnits(minor, currency = 'INR') {
  return formatCurrency(minor / 100, currency)
}

export function formatDuration(minutes) {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest}m`
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function formatTime(iso, timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(new Date(iso))
}

export function formatDate(iso, timeZone = DEFAULT_TIME_ZONE, options = {}) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
    ...options,
  }).format(new Date(iso))
}

export function formatDateTime(iso, timeZone = DEFAULT_TIME_ZONE) {
  return `${formatDate(iso, timeZone)} · ${formatTime(iso, timeZone)}`
}

/** Calendar date (YYYY-MM-DD) of an instant in a time zone. */
export function toLocalDateKey(iso, timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(iso),
  )
}

export function formatReleaseDate(dateKey) {
  // Plain calendar dates (no time) are formatted in UTC so they never shift a day.
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${dateKey}T00:00:00Z`),
  )
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** The next `count` calendar dates (YYYY-MM-DD) in a time zone, starting today. */
export function nextDateKeys(count, timeZone = DEFAULT_TIME_ZONE) {
  const now = Date.now()
  return Array.from({ length: count }, (_, day) => toLocalDateKey(new Date(now + day * 86_400_000).toISOString(), timeZone))
}

/** "m:ss" for a remaining duration in milliseconds. */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
